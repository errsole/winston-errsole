declare module 'winston-errsole' {
  import TransportStream from 'winston-transport';

  interface Log {
    level: string;
    message: string;
    meta?: Record<string, any>;
  }

  class WinstonErrsole extends TransportStream {
    private levelMapping: Record<string, string>;  

    constructor(options?: TransportStream.TransportStreamOptions); 

    /**
     * Core logging method exposed to Winston.
     * @param logInfo - Log information including level, message, and metadata.
     * @param callback - Optional callback function.
     */
    log(logInfo: Log, callback?: () => void): void;
  }

  export default WinstonErrsole;
}
