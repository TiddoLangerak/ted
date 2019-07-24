import { Window } from '../window';
import { BufferCoordinatesOutOfRangeException } from "../exceptions/BufferCoordinatesOutOfRangeException";
import { aScreen } from "../screen/screen.test-factory";
jest.mock("../screen");

describe("Window", () => {
  describe("getScreenCoordinates", () => {
    describe("Given a Window", () => {
      let window: Window;
      beforeEach(() => {
        window = new Window(aScreen(), "");
      });

      describe("With some content", () => {
        const firstLine = "first line";
        const secondLine = "second line";
        beforeEach(() => {
          window.setContent(`${firstLine}\n${secondLine}`);
        });

        it("throws when the y coodinate is negative", () => {
          expect(
            () => window.getScreenCoordinates({ x: 0, y: -1 })
          ).toThrow(BufferCoordinatesOutOfRangeException);
        });
        it("throws when the y coodinate is equal to number of lines", () => {
          expect(
            () => window.getScreenCoordinates({ x: 0, y: 2 })
          ).toThrow(BufferCoordinatesOutOfRangeException);
        });
        it("throws when the y coodinate is larger than number of lines", () => {
          expect(
            () => window.getScreenCoordinates({ x: 0, y: 20 })
          ).toThrow(BufferCoordinatesOutOfRangeException);
        });

        it("throws when the x coodinate is negative", () => {
          expect(
            () => window.getScreenCoordinates({ x: -1, y: 0 })
          ).toThrow(BufferCoordinatesOutOfRangeException);
        });
        it("does not throw when the x coodinate is equal to the line length", () => {
          expect(
            () => window.getScreenCoordinates({ x: firstLine.length, y: 0 })
          ).not.toThrow(BufferCoordinatesOutOfRangeException);
        });
        it("throws when the x coodinate is larger than the line length", () => {
          expect(
            () => window.getScreenCoordinates({ x: 200, y: 0 })
          ).toThrow(BufferCoordinatesOutOfRangeException);
        });

        describe("With bufferOffset.y = 0", () => {
          beforeEach(() => {
            window.bufferOffset.y = 0;
          });
          it("returns coordinate matching the buffer coordinates", () => {
            expect(
              window.getScreenCoordinates({ x: 0, y : 0})
            ).toEqual({
              column: 0,
              row: 0
            });

            expect(
              window.getScreenCoordinates({ x: 1, y : 1})
            ).toEqual({
              column: 1,
              row: 1
            });

            expect(
              window.getScreenCoordinates({ x: 8, y : 1})
            ).toEqual({
              column: 8,
              row: 1
            });
          });
        });

        describe("With bufferOffset.y = 1", () => {
          beforeEach(() => {
            window.bufferOffset.y = 1;
          });
          it("returns adjusted coordinates", () => {
            expect(
              window.getScreenCoordinates({ x: 0, y : 0})
            ).toEqual({
              column: 0,
              row: -1
            });

            expect(
              window.getScreenCoordinates({ x: 1, y : 1})
            ).toEqual({
              column: 1,
              row: 0
            });

            expect(
              window.getScreenCoordinates({ x: 8, y : 1})
            ).toEqual({
              column: 8,
              row: 0
            });
          });
        });
      });

      describe("With a line starting with tabs", () => {
        beforeEach(() => {
          window.setContent("\t\t\thello");
        });
        describe("And tab-width of 7", () => {
          const tabWidth = 7;
          beforeEach(() => {
            window.tabWidth = 7;
          });
          it ("Adjusts the column based on tabs", () => {
            expect(
              window.getScreenCoordinates({ x: 0, y: 0 })
            ).toEqual({
              column: 0,
              row: 0
            });
            expect(
              window.getScreenCoordinates({ x: 1, y: 0 })
            ).toEqual({
              column: 7,
              row: 0
            });
            expect(
              window.getScreenCoordinates({ x: 5, y: 0 })
            ).toEqual({
              column: 23,
              row: 0
            });
          });
        });
      });
    });
  });
});
