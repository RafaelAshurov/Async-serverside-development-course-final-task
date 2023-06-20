const Cost = require("../models/cost");
const Report = require("../models/report");
const CostsHandler = require("./costs");

class ReportsHandler {
  /**
   * Retrieves the report for a specific user, year, and month.
   * If a similar report exists, returns its details.
   * If not, creates a new report and returns its details.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   * @returns {Promise<void>}
   */
  async getReport(req, res, next) {
    try {
      // parse strings to numbers
      req.query.year = parseInt(req.query.year);
      req.query.month = parseInt(req.query.month);

      this.validateAndExtractReportDetails(req.query);
      const { user_id, year, month } = req.query;

      // Check if a similar report already exists
      const existingReport = await Report.findOne({
        user_id: parseInt(user_id),
        year: year,
        month: month,
      });

      if (existingReport) {
        res.json(existingReport.details);
      } else {
        const newReport = await this.createReportDetails(user_id, year, month);
        res.json(newReport.details);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validates the details from the request query.
   * @param {Object} reqQuery - The request query containing the report details.
   * @throws {Object} 400 - Bad Request if any required field is missing or if the date is invalid.
   */
  validateAndExtractReportDetails(reqQuery) {
    // Check for missing values
    if (!reqQuery.user_id || !reqQuery.year || !reqQuery.month) {
      throw {
        status: 400,
        message: "One of the following is missing: user_id, year, month",
      };
    } else if (!this.isValidDate(reqQuery.year, reqQuery.month)) {
      throw {
        status: 400,
        message: "Invalid date, accepts only: 1900<year<2100, 1<month<12",
      };
    }
  }

  /**
   * Creates a new report for a specific user, year, and month, and saves it in the database.
   * @param {Number} user_id - The user ID.
   * @param {Number} year - The year.
   * @param {Number} month - The month.
   * @returns {Promise<Object>} The newly created report.
   */
  async createReportDetails(user_id, year, month) {
    // Create a new report
    const report = await this.getReportDetails(user_id, year, month);

    // Generate an object with properties for each category
    // The `accumulator` represents the report details object, and `current` represents each item in the report array
    const result = report.reduce((accumulator, current) => {
      // Assign an array of costs to each category
      accumulator[current._id] = current.costs;
      return accumulator;
    }, {});

    // Include categories without any costs
    CostsHandler.costCategories.forEach((category) => {
      if (!result.hasOwnProperty(category)) {
        // If the category doesn't exist in the result, assign an empty array to it
        result[category] = [];
      }
    });

    // Save the new report to the database
    return await Report.create({
      user_id: parseInt(user_id),
      year: year,
      month: month,
      details: result,
    });
  }

  /**
   * Retrieves the cost details for a specific user, year, and month by grouping the costs based on categories.
   * @param {Number} user_id - The user ID.
   * @param {Number} year - The year.
   * @param {Number} month - The month.
   * @returns {Promise<Array>} An array of cost details for each category.
   */
  getReportDetails(user_id, year, month) {
    // Pipeline to aggregate the costs
    const pipeline = [
      {
        $match: {
          user_id: parseInt(user_id),
          year: year,
          month: month,
        },
      },
      {
        // Groups the documents based on the _id field, which in this case represents the category
        $group: {
          _id: "$category",
          costs: {
            // Appends the cost details to the costs array for each category
            $push: {
              day: "$day",
              description: "$description",
              sum: "$sum",
            },
          },
        },
      },
    ];

    // Aggregate costs based on category
    return Cost.aggregate(pipeline);
  }

  /**
   * Checks if a given year and month represent a valid date.
   * The year is considered valid if it's a number between 1970 and 2100.
   * The month is considered valid if it's a number between 1 and 12.
   * @param {Number} year - The year to be checked.
   * @param {Number} month - The month to be checked.
   * @returns {Boolean} true if the date is valid, false otherwise.
   */
  isValidDate(year, month) {
    const areNumbers = !isNaN(year) && !isNaN(month);
    const yearWithinRange = year >= 1970 && year <= 2100;
    const monthWithinRange = month >= 1 && month <= 12;

    return areNumbers && yearWithinRange && monthWithinRange;
  }
}

module.exports = new ReportsHandler();
