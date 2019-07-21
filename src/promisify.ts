/* @flow */

export type NodeCallback<R, E> = (err: E, result: R) => void;
export default function promisify<R, E>(func: (NodeCallback<R, E>) => void): Promise<R> {
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
