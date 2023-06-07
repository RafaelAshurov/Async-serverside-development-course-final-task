const Cost = require("../models/cost");
const Report = require("../models/report");
const CostsHandler = require("./costs");

class ReportsHandler {
  /**
   * Validates and extracts the report details from the request query.
   * @param {Object} reqQuery - The request query containing the report details.
   * @returns {Object} The validated and extracted report details.
   * @throws {Object} 400 - Bad Request if any required field is missing or if the date is invalid.
   */
  validateAndExtractReportDetails(reqQuery) {
    // Check for missing values
    if (!reqQuery.user_id || !reqQuery.year || !reqQuery.month) {
      throw {
        status: 400,
        message: "One of the following is missing: user_id, year, month",
      };
    } else {
      // Validate year, month
      reqQuery.year = parseInt(reqQuery.year);
      reqQuery.month = parseInt(reqQuery.month);
      if (
        isNaN(reqQuery.year) ||
        reqQuery.year < 1900 ||
        reqQuery.year > 2100 ||
        isNaN(reqQuery.month) ||
        reqQuery.month < 1 ||
        reqQuery.month > 12
      ) {
        throw {
          status: 400,
          message: "Invalid date, accepts only: 1900<year<2100, 1<month<12",
        };
      } else {
        // Validation passed
        return reqQuery;
      }
    }
  }

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
      const { user_id, year, month } = this.validateAndExtractReportDetails(
        req.query
      );

      // Check if a similar report already exists
      const existingReport = await Report.findOne({
        user_id: parseInt(user_id),
        year: year,
        month: month,
      });

      if (existingReport) {
        // If a similar report exists, return its details
        res.json(existingReport.details);
      } else {
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
        const newReport = await Report.create({
          user_id: parseInt(user_id),
          year: year,
          month: month,
          details: result,
        });

        res.json(newReport.details);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves the cost details for a specific user, year, and month.
   * @param {Number} user_id - The user ID.
   * @param {Number} year - The year.
   * @param {Number} month - The month.
   * @returns {Promise<Array>} The cost details for the specified user, year, and month.
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
}

module.exports = new ReportsHandler();
