// Rafael Ashurov 312054711
// Netanel Braginsky 205801160

const Cost = require("../models/cost");
const Report = require("../models/report");

class CostsHandler {
  /**
   * Array of valid cost categories.
   * @type {string[]}
   */
  costCategories = [
    "food",
    "health",
    "housing",
    "sport",
    "education",
    "transportation",
    "other",
  ];

  /**
   * Creates a new cost item.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   * @returns {Promise<void>}
   */
  async createNewCost(req, res, next) {
    try {
      // validate and throw in case of validation failure
      this.validateCostDetails(req.body);

      const { user_id, year, month, day, description, category, sum } =
        req.body;

      const nextId = await this.generateNextCostId();

      const costData = {
        id: nextId,
        user_id,
        year,
        month,
        day,
        description,
        category,
        sum,
      };

      const cost = await Cost.create(costData);

      // Return the created cost to the user immediately
      res.json(cost);

      // Delete report if the cost belongs to it
      await this.checkAndDeleteCostReport(user_id, year, month);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validates the cost details and throws in case of a failed validation.
   * @param {Object} reqBody - The request body containing the cost details.
   * @returns {Object} The validated and extracted cost details.
   * @throws {Object} 400 - Bad Request if any required field is missing or if the category is invalid.
   */
  validateCostDetails(reqBody) {
    let errorMessage = "";
    // Missing values
    if (!this.hasAllRequiredFields(reqBody)) {
      errorMessage =
        "One of the following is missing: user_id, year, month, day, description, category, sum.";

      // Wrong category
    } else if (!this.costCategories.includes(reqBody.category)) {
      errorMessage = "Wrong category";
    } else if (!this.isValidDate(reqBody.year, reqBody.month, reqBody.day)) {
      errorMessage =
        "Invalid date, accepts only: 1970<year<2100, 1<month<12, day according the month provided";
    }

    if (errorMessage)
      throw {
        status: 400,
        message: errorMessage,
      };
  }

  /**
   * Checks if a cost belongs to an existing report and deletes the report if found.
   * @param {number} user_id - The user ID.
   * @param {number} year - The year.
   * @param {number} month - The month.
   * @returns {Promise<void>}
   */
  async checkAndDeleteCostReport(user_id, year, month) {
    const existingReport = await Report.findOne({
      user_id: parseInt(user_id),
      year: year,
      month: month,
    });

    if (existingReport) {
      // Delete the existing report
      await Report.findByIdAndDelete(existingReport._id);
    }
  }

  hasAllRequiredFields(reqBody) {
    return (
      reqBody.user_id &&
      reqBody.year &&
      reqBody.month &&
      reqBody.day &&
      reqBody.description &&
      reqBody.category &&
      reqBody.sum
    );
  }

  isValidDate(year, month, day) {
    const areNumbers = parseInt(year) && parseInt(month) && parseInt(day);
    const yearWithinRange = year >= 1970 && year <= 2100;
    const monthWithinRange = month >= 1 && month <= 12;
    const dayWithinRange =
      day >= 1 && day <= new Date(year, month, 0).getDate();

    return areNumbers && yearWithinRange && monthWithinRange && dayWithinRange;
  }

  async generateNextCostId() {
    const lastCost = await Cost.findOne(
      {},
      { id: 1 },
      { sort: { id: -1 } }
    ).lean();

    // Generate the next id based on the last id
    return lastCost ? lastCost.id + 1 : 1;
  }
}

module.exports = new CostsHandler();
