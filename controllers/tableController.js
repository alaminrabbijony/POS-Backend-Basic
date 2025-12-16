const createHttpError = require("http-errors");
const Table = require("../models/tableModel");

const addTable = async (req, res, next) => {
  console.log("REQ BODY:", req.body);

  try {
    const { tableNo, seats } = req.body;
    if (!tableNo) return next(createHttpError(400, "Please  provide the table no!"));
    const isTablePresent = await Table.findOne({ tableNo });
    if (isTablePresent) return next(createHttpError(400, "Table already exists!"));

    const newTable = new Table({ tableNo, seats });
    await newTable.save();

    res.status(201).json({
      success: true,
      message: "Table successfully added",
      data: newTable,
    });
  } catch (error) {
    return next(error);
  }
};

const getTable = async (req, res, next) => {
  try {
    const tables = await Table.find().populate({
      path: "currentOrder",
      select: "customerDetails"
    })
    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    return next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const {id} = req.params.id;
    if (!id) return next(createHttpError(401, "Invalid id!"))
    const { status, orderId } = req.body;
    const updatedTable = await Table.findByIdAndUpdate(
        id,
      { status, currentOrder: orderId },
      { new: true }
    );
    if (!updatedTable) return next(createHttpError(404, "Table not found"));
  } catch (error) {
    next(error);
  }
};

const deleteTable = async (req, res, next) => {
    try {
      const {id} = req.params
      if(!id) return next(createHttpError(401, "Inavalid id!!"))
        const table = await Table.findByIdAndDelete(id)
      if(!table) return next(createHttpError(401, "Inavalid id!!"))
        res.status(201).json({
          message: "Table successfully deleted",
          id,
      })

    } catch (error) {
      next(error)
    }
}

module.exports = { addTable, getTable, updateTable, deleteTable };
