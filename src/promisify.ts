type NodeCallback<R, E> = (err: E, result?: R) => unknown;

export default function promisify<R, E>(
  func: (cb: NodeCallback<R, E>) => unknown
): Promise<R> {
  return new Promise((resolve, reject) => {
    func((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
