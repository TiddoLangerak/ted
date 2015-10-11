const EDITOR = ['CONTENT', 'CURSOR'];

export default [
	{
		split : 'vertical',
		buffers : [
			{
				layers : [
					...EDITOR,
					'LOG'
				],
				height : 'auto'
			},
			{
				layers : ['STATUS_LINE'],
				height : 1
			},
			{
				layers : ['COMMAND_LINE'],
				height : 1
			}
		]
	}
];
