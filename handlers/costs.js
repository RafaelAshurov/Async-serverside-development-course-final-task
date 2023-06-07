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
   * Validates and extracts the cost details from the request body.
   * @param {Object} reqBody - The request body containing the cost details.
   * @returns {Object} The validated and extracted cost details.
   * @throws {Object} 400 - Bad Request if any required field is missing or if the category is invalid.
   */
  validateAndExtractCostDetails(reqBody) {
    // Missing values
    if (
      !reqBody.user_id ||
      !reqBody.year ||
      !reqBody.month ||
      !reqBody.day ||
      !reqBody.description ||
      !reqBody.category ||
      !reqBody.sum
    ) {
      throw {
        status: 400,
        message:
          "One of the following is missing: user_id, year, month, day, description, category, sum.",
      };

      // Wrong category
    } else if (!this.costCategories.includes(reqBody.category)) {
      throw {
        status: 400,
        message: "Wrong category",
      };
    } else {
      // Validate year, month, and day
      reqBody.year = parseInt(reqBody.year);
      reqBody.month = parseInt(reqBody.month);
      reqBody.day = parseInt(reqBody.day);

      if (
        isNaN(reqBody.year) ||
        reqBody.year < 1970 ||
        reqBody.year > 2100 ||
        isNaN(reqBody.month) ||
        reqBody.month < 1 ||
        reqBody.month > 12 ||
        isNaN(reqBody.day) ||
        reqBody.day < 1 ||
        reqBody.day > new Date(reqBody.year, reqBody.month, 0).getDate()
      ) {
        throw {
          status: 400,
          message:
            "Invalid date, accepts only: 1970<year<2100, 1<month<12, day according the month provided",
        };
      } else {
        // Validation passed
        return reqBody;
      }
    }
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

  /**
   * Creates a new cost item.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   * @returns {Promise<void>}
   */
  async createNewCost(req, res, next) {
    try {
      const { user_id, year, month, day, description, category, sum } =
        this.validateAndExtractCostDetails(req.body);

      // Fetch the last id from the costs collection
      const lastCost = await Cost.findOne(
        {},
        { id: 1 },
        { sort: { id: -1 } }
      ).lean();

      // Generate the next id based on the last id
      const nextId = lastCost ? lastCost.id + 1 : 1;

      const costData = {
        id: nextId,
        user_id,
        year: year,
        month: month,
        day: day,
        description,
        category,
        sum,
      };

      const cost = await Cost.create(costData);

      // Return the created cost to the user immediately
      res.json(cost);

      // Check if the new cost belongs to an existing report
      await this.checkAndDeleteCostReport(user_id, year, month);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CostsHandler();
