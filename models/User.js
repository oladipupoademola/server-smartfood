const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // ✅ hides password by default
    },
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Optional: ensure email is always lowercase before save
userSchema.pre("save", function (next) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
