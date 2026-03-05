import mongoose from "mongoose";

const StorageScheme = new mongoose.Schema({
    url: {
        type: String
    },
    filename: {
        type: String
    },
}, {
    timestamps: true,
    versionKey: false
});

let Images = mongoose.model("images", StorageScheme)

export { Images }