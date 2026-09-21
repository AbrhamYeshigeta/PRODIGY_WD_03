import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    addresses: [
      {
        label:      { type: String, trim: true, default: 'Home' },
        fullName:   { type: String, trim: true },
        phone:      { type: String, trim: true },
        line1:      { type: String, trim: true },
        line2:      { type: String, trim: true },
        city:       { type: String, trim: true },
        state:      { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country:    { type: String, trim: true, default: 'Ethiopia' },
        isDefault:  { type: Boolean, default: false },
      },
    ],
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare plaintext vs hash
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);