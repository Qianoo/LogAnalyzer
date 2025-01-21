export function parseLogFile(logContent) {
  const MAX_BLOCK_LINES = 300;      // 设置最大行数限制
  const LINES_BEFORE_FIRST = 20;    // 第一个关键字前显示的行数
  const LINES_AFTER_LAST = 10;     // 最后一个关键字后显示的行数
  const CONTEXT_LENGTH = 30;        // 关键字前后的上下文长度
  
  const keywords = [
    // C++ 常见错误日志关键字
    'Segmentation fault', 'core dumped', 'Bus error', 'undefined reference',
    'stack overflow', 'double free', 'invalid pointer', 'malloc failed',
    'SIGABRT', 'SIGSEGV',
    
    // Java 常见错误日志关键字
    'NullPointerException', 'ArrayIndexOutOfBoundsException', 'ClassNotFoundException',
    'NoSuchMethodError', 'IllegalArgumentException', 'OutOfMemoryError',
    'StackOverflowError', 'ClassCastException',
    
    // Android 系统性错误日志关键字
    'ANR', 'FATAL EXCEPTION', 'ActivityManager: Force finishing activity',
    'E/AndroidRuntime', 'W/ActivityThread','StrictMode',
    
    // Linux Kernel 常见错误日志关键字
    'kernel panic', 'Oops', 'BUG:', 'Call Trace',
    'slab corruption', 'general protection fault', 'I/O error', 'bad page state',
    
    // 通用系统错误日志关键字
    'Error', 'error', 'Critical', 'Failed', 'Exception', 'Timeout',
    'Permission denied', 'Device not found',
  ];

  // 预编译所有正则表达式并创建快速查找表
  const keywordMap = new Map();
  for (const keyword of keywords) {
    keywordMap.set(keyword, {
      regex: new RegExp(`\\b${keyword}\\b`),
      length: keyword.length
    });
  }

  // 使用 Set 优化查找
  const processedLines = new Set();
  const contentToBlock = new Map();

  // 快速分割行并预分配数组
  const lines = logContent.split('\n');
  const totalLines = lines.length;
  const keywordBlocks = [];
  
  // 预分配缓冲区
  const lineBuffer = new Array(LINES_BEFORE_FIRST + LINES_AFTER_LAST);
  let bufferIndex = 0;
  let currentBlock = null;
  let lastKeywordIndex = -1;

  // 优化关键字匹配
  function hasExactKeyword(line) {
    for (const [keyword, {regex, length}] of keywordMap) {
      // 快速预检查
      if (line.length >= length && line.includes(keyword)) {
        if (regex.test(line)) {
          return { keyword, matchedText: keyword };
        }
      }
    }
    return null;
  }

  // 优化上下文获取
  function getKeywordContext(line, matchedText) {
    const index = line.indexOf(matchedText);
    if (index === -1) return null;

    // 使用更快的字符串操作
    let beforeStart = index;
    while (beforeStart > 0 && line[beforeStart - 1] !== ' ') beforeStart--;
    
    let afterEnd = index + matchedText.length;
    while (afterEnd < line.length && line[afterEnd] !== ' ') afterEnd++;

    return {
      before: line.slice(beforeStart, index),
      after: line.slice(index + matchedText.length, afterEnd)
    };
  }

  // 优化块内容特征生成
  function getBlockContent(startIndex, endIndex) {
    // 只使用关键行作为特征
    const key = lines[startIndex];
    return `${startIndex}-${endIndex}-${key}`;
  }

  // 主处理循环
  for (let i = 0; i < totalLines; i++) {
    const line = lines[i];
    
    if (processedLines.has(i)) {
      continue;
    }

    // 优化缓冲区管理
    lineBuffer[bufferIndex % lineBuffer.length] = line;
    bufferIndex++;

    const matchResult = hasExactKeyword(line);
    if (matchResult) {
      const { keyword, matchedText } = matchResult;

      if (i === lastKeywordIndex + 1) {
        lastKeywordIndex = i;
        if (currentBlock) {
          currentBlock.lines.push(line);
          processedLines.add(i);
        }
        continue;
      }

      const context = getKeywordContext(line, matchedText);
      if (!context) continue;

      lastKeywordIndex = i;

      // 生成块特征
      const blockContent = getBlockContent(i, Math.min(i + LINES_AFTER_LAST, totalLines));
      let block = contentToBlock.get(blockContent);

      if (block) {
        block.lineNumbers.add(i);
        block.duplicateCount++;
        processedLines.add(i);
        continue;
      }

      // 创建新块时优化数组操作
      const blockLines = new Array(Math.min(MAX_BLOCK_LINES, LINES_AFTER_LAST + 1));
      let lineCount = 0;
      for (let j = Math.max(0, bufferIndex - LINES_BEFORE_FIRST); j < bufferIndex; j++) {
        blockLines[lineCount++] = lineBuffer[j % lineBuffer.length];
      }

      block = {
        startLine: Math.max(0, i - LINES_BEFORE_FIRST),
        endLine: Math.min(i + LINES_AFTER_LAST, totalLines),
        keywords: [keyword],
        lines: blockLines.slice(0, lineCount),
        duplicateCount: 1,
        lineNumbers: new Set([i]),
        summaryLine: line
      };

      contentToBlock.set(blockContent, block);
      
      if (!currentBlock) {
        currentBlock = block;
      } else if (i > currentBlock.endLine || currentBlock.lines.length >= MAX_BLOCK_LINES) {
        keywordBlocks.push(currentBlock);
        currentBlock = block;
      } else {
        currentBlock.keywords.push(keyword);
        currentBlock.lines.push(line);
        currentBlock.lineNumbers.add(i);
      }
      processedLines.add(i);
    } else if (currentBlock && currentBlock.lines.length < MAX_BLOCK_LINES) {
      currentBlock.lines.push(line);
      
      if (i >= currentBlock.endLine) {
        keywordBlocks.push(currentBlock);
        currentBlock = null;
        bufferIndex = 0;
        lastKeywordIndex = -1;
      }
    }
  }

  if (currentBlock) {
    keywordBlocks.push(currentBlock);
  }

  // 优化最终处理
  const finalBlocks = Array.from(contentToBlock.values());
  for (const block of finalBlocks) {
    const lineNumbers = Array.from(block.lineNumbers);
    lineNumbers.sort((a, b) => a - b);
    block.summary = `此日志模式重复出现了 ${block.duplicateCount} 次`;
    block.summaryLine = `行 ${lineNumbers.join('、')}: ${block.summaryLine}`;
  }

  return finalBlocks;
} 