const EDITOR = ['CONTENT', 'CURSOR'];

export type Buffer = {
  // eslint-disable-next-line no-use-before-define
  layers: Layer[],
  size: number | 'auto';
};
export type VerticalLayout = {
  split: 'vertical',
  buffers: Buffer[]
};
export type HorizontalLayout = {
  split: 'horizontal',
  buffers: Buffer[]
};

export type Layer = VerticalLayout | HorizontalLayout | string;

export default ([
  {
    split: 'vertical',
    buffers: [
      {
        layers: [
          ...EDITOR,
          'LOG',
        ],
        size: 'auto',
      },
      {
        layers: ['STATUS_LINE'],
        size: 1,
      },
      {
        layers: ['COMMAND_LINE'],
        size: 1,
      },
    ],
  },
]: Layer[]);
