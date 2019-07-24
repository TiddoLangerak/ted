import { aCursor } from "./cursor.test-factory";
import { Cursor } from "../cursor";
jest.mock("../screen");

describe("Cursor", () => {
  describe("Update()", () => {
    describe("Given a cursor", () => {
      let cursor: Cursor;

      beforeEach(() => {
        cursor = aCursor();
      });

      describe("when passed in an update function", () =>{
        const updateFunction = jest.fn();

        beforeEach(() => updateFunction.mockReset());

        it("calls the the function with the cursor as argument", () => {
          cursor.update(updateFunction);
          expect(updateFunction).toHaveBeenCalledWith(cursor);
        });
      });

    });
  });
});
