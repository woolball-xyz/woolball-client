/**
 * Type definitions for Chrome Extension API
 * 
 * This file contains type definitions for the Chrome Extension API
 * used in the browser extension features.
 */

declare namespace chrome {
  namespace runtime {
    function getURL(path: string): string;
    const id: string;
  }
  
  namespace downloads {
    interface DownloadOptions {
      url: string;
      filename?: string;
      conflictAction?: string;
      saveAs?: boolean;
      method?: string;
      headers?: Array<{name: string, value: string}>;
      body?: string;
    }
    
    function download(options: DownloadOptions): Promise<number>;
  }
}