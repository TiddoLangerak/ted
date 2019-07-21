export interface RequestFileArg {
  file: string;
};

export interface RequestFile {
  action: 'requestFile';
  arguments: RequestFileArg
}

export interface SaveFileArg {
  file: string,
  force?: boolean
};

export interface SaveFile {
  action: 'saveFile';
  arguments: SaveFileArg;
}

export interface UndoArg {
  file: string
};

export interface Undo {
  action: 'undo';
  arguments: UndoArg;
}

export interface RedoArg {
  file: string
};

export interface Redo {
  action: 'redo';
  arguments: RedoArg;
}

export type RpcAction = RequestFile
  | SaveFile
  | Undo
  | Redo;
