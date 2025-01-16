export function parseLogFile(logContent) {
  const MAX_BLOCK_LINES = 300;      // 设置最大行数限制
  const LINES_BEFORE_FIRST = 100;    // 第一个关键字前显示的行数
  const LINES_AFTER_LAST = 50;     // 最后一个关键字后显示的行数
  
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
    'Process terminated', 'BinderProxy', 'E/AndroidRuntime', 'W/ActivityThread',
    'StrictMode',
    
    // Linux Kernel 常见错误日志关键字
    'kernel panic', 'Oops', 'BUG:', 'soft lockup', 'hard lockup', 'Call Trace',
    'slab corruption', 'general protection fault', 'I/O error', 'bad page state',
    
    // 通用系统错误日志关键字
    'Error', 'Warning', 'Critical', 'Failed', 'Exception', 'Timeout',
    'Permission denied', 'Device not found'
  ];
  const lines = logContent.split('\n');
  const keywordBlocks = [];
  let currentBlock = null;

  lines.forEach((line, index) => {
    const foundKeywords = keywords.filter(keyword => line.includes(keyword));
    if (foundKeywords.length > 0) {
      if (!currentBlock || index - currentBlock.endLine > LINES_AFTER_LAST) {
        if (currentBlock) {
          // 限制日志块的行数
          const blockLength = currentBlock.endLine - currentBlock.startLine;
          if (blockLength > MAX_BLOCK_LINES) {
            currentBlock.endLine = currentBlock.startLine + MAX_BLOCK_LINES;
          }
          keywordBlocks.push(currentBlock);
        }
        currentBlock = {
          keywords: foundKeywords,
          startLine: Math.max(0, index - LINES_BEFORE_FIRST),
          endLine: Math.min(lines.length, index + LINES_AFTER_LAST),
          lines: []
        };
      } else {
        currentBlock.keywords.push(...foundKeywords);
        // 更新结束行，但确保不超过最大行数限制
        const newEndLine = Math.min(lines.length, index + LINES_AFTER_LAST);
        if (newEndLine - currentBlock.startLine <= MAX_BLOCK_LINES) {
          currentBlock.endLine = newEndLine;
        }
      }
    }
    if (currentBlock) {
      currentBlock.lines.push(line);
    }
  });

  // 处理最后一个块
  if (currentBlock) {
    const blockLength = currentBlock.endLine - currentBlock.startLine;
    if (blockLength > MAX_BLOCK_LINES) {
      currentBlock.endLine = currentBlock.startLine + MAX_BLOCK_LINES;
    }
    keywordBlocks.push(currentBlock);
  }

  return keywordBlocks;
} 