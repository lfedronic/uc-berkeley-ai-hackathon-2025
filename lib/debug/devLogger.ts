/* Simple global collector for layout-agent debugging.
   Dump it any time with __LAYOUT_DEBUG__.dump()            */

type Entry =
  | { t: 'tool'; name: string; args: any; result: any; ms: number }
  | { t: 'env'; snapshot: any }
  | { t: 'layout'; json: any; labels: Record<string, string> }
  | { t: 'llm'; direction: 'req' | 'res'; payload: any };

class DevLogger {
  private log: Entry[] = [];
  push(e: Entry) { this.log.push(e); }
  dump = () => {
    console.groupCollapsed('%c🛠 Layout Debug dump', 'color:#36c');
    console.table(this.log.map((e) => ({ t: e.t, ...(e as any) })));
    console.groupEnd();
    // also pipe a raw JSON you can copy
    console.log('💾 JSON', JSON.stringify(this.log, null, 2));
  };
}

/* attach to both browser & Node global */
export const devLog: DevLogger =
  ((typeof window !== 'undefined' ? (window as any) : global) as any)
    .__LAYOUT_DEBUG__ ?? new DevLogger();

((typeof window !== 'undefined' ? (window as any) : global) as any).__LAYOUT_DEBUG__ = devLog;
