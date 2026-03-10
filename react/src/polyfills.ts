import { Buffer } from 'buffer';
import * as process from 'process';

if (typeof window !== 'undefined') {
    // Inject Node.js globals required by simple-peer and readable-stream into the browser window object
    window.global = window;
    window.Buffer = Buffer;
    window.process = process;
}
