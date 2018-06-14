// Require mongoose
var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new CommentsSchema object
// This is similar to a Sequelize model
var CommentsSchema = new Schema({
    body: {
        type: String
    },
    article: {
        type: Schema.Types.ObjectId,
        ref: "Article"
    }
});

// Creates our model using mongoose's model method
var Comments = mongoose.model("Comments", CommentsSchema);

// Export the Comments model
module.exports = Comments;
