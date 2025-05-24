export const logger = {
  errors: [] as string[],
  
  log: (message: string, data?: any) => {
    console.log(message, data);
    logger.errors.push(`${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}`);
  },
  
  error: (message: string, error?: any) => {
    console.error(message, error);
    logger.errors.push(`${new Date().toISOString()} - ERROR: ${message} ${error ? JSON.stringify(error) : ''}`);
  },
  
  downloadLogs: () => {
    const blob = new Blob([logger.errors.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomado-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
  
  clear: () => {
    logger.errors = [];
  }
}; 