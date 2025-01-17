export function parseLogFile(logContent) {
  const MAX_BLOCK_LINES = 300;      // 设置最大行数限制
  const LINES_BEFORE_FIRST = 10;    // 第一个关键字前显示的行数
  const LINES_AFTER_LAST = 10;     // 最后一个关键字后显示的行数
  
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
    'Error', 'Critical', 'Failed', 'Exception', 'Timeout',
    'Permission denied', 'Device not found'
  ];

  // 使用迭代器处理大文件
  function* createLineIterator(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      yield { line: lines[i], index: i };
    }
  }

  const keywordBlocks = [];
  let currentBlock = null;
  let lineBuffer = [];  // 用于临时存储最近的行
  const lineIterator = createLineIterator(logContent);

  for (const { line, index } of lineIterator) {
    // 保持最近 LINES_BEFORE_FIRST 行的缓冲
    lineBuffer.push(line);
    if (lineBuffer.length > LINES_BEFORE_FIRST) {
      lineBuffer.shift();
    }

    // 检查关键字
    const foundKeywords = keywords.filter(keyword => line.includes(keyword));
    
    if (foundKeywords.length > 0) {
      if (!currentBlock) {
        // 创建新块，使用缓冲的行
        currentBlock = {
          startLine: Math.max(0, index - LINES_BEFORE_FIRST),
          endLine: Math.min(index + LINES_AFTER_LAST),
          keywords: foundKeywords,
          lines: [...lineBuffer]
        };
      } else {
        // 更新现有块
        currentBlock.keywords.push(...foundKeywords);
        currentBlock.endLine = Math.min(
          index + LINES_AFTER_LAST,
          currentBlock.startLine + MAX_BLOCK_LINES
        );
      }
      currentBlock.lines.push(line);
    } else if (currentBlock) {
      // 继续添加行到当前块
      currentBlock.lines.push(line);
      
      // 检查是否应该结束当前块
      if (index >= currentBlock.endLine || 
          currentBlock.lines.length >= MAX_BLOCK_LINES) {
        keywordBlocks.push(currentBlock);
        currentBlock = null;
        lineBuffer = [line];  // 重置缓冲区，保留当前行
      }
    }
  }

  // 处理最后一个块
  if (currentBlock) {
    keywordBlocks.push(currentBlock);
  }

  return keywordBlocks;
} 