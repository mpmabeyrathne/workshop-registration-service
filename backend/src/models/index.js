import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM("ADMIN", "MANAGER", "STAFF"),
    allowNull: false
  }
});

export const Workshop = sequelize.define("Workshop", {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  instructor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, isInt: true }
  },
  status: {
    type: DataTypes.ENUM("SCHEDULED", "CANCELLED", "COMPLETED"),
    defaultValue: "SCHEDULED"
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

export const Registration = sequelize.define("Registration", {
  attendeeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  attendeeEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "CANCELLED"),
    defaultValue: "ACTIVE"
  },
  registeredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

Workshop.hasMany(Registration, {
  foreignKey: { name: "workshopId", allowNull: false }
});

Registration.belongsTo(Workshop, {
  foreignKey: "workshopId"
});

Registration.belongsTo(User, {
  as: "registeredByUser",
  foreignKey: { name: "registeredBy", allowNull: false }
});

Registration.belongsTo(User, {
  as: "cancelledByUser",
  foreignKey: "cancelledBy"
});