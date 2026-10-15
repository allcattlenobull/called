import type { SimBlock } from '../data/simulations';

export function SimBlocks({ blocks }: { blocks: SimBlock[] }) {
  return (
    <div className="simblocks">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'text':
            return <p key={i}>{b.text}</p>;
          case 'list':
            return (
              <div key={i}>
                {b.title && <h3 className="h4">{b.title}</h3>}
                <ul>
                  {b.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            );
          case 'quote':
            return (
              <figure key={i} className="quote">
                <blockquote style={{ margin: 0 }}>“{b.text}”</blockquote>
                <figcaption>{b.who}</figcaption>
              </figure>
            );
          case 'code':
            return (
              <figure key={i} style={{ margin: 0 }}>
                {b.caption && <figcaption className="small muted" style={{ marginBottom: 'var(--s-2)' }}>{b.caption}</figcaption>}
                <pre className="codeblock" tabIndex={0}>
                  <code>{b.code}</code>
                </pre>
              </figure>
            );
          case 'table':
            return (
              <div key={i} className="table-wrap" tabIndex={0} role="region" aria-label={b.caption}>
                <table className="table">
                  <caption className="visually-hidden">{b.caption}</caption>
                  <thead>
                    <tr>
                      {b.columns.map((c) => (
                        <th key={c} scope="col">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri}>
                        {r.map((cell, ci) =>
                          ci === 0 ? (
                            <th key={ci} scope="row">
                              {cell}
                            </th>
                          ) : (
                            <td key={ci} className={typeof cell === 'number' ? 'num' : undefined}>
                              {typeof cell === 'number' ? cell.toLocaleString('en-US') : cell}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="table-caption small muted">{b.caption}</p>
              </div>
            );
        }
      })}
    </div>
  );
}
