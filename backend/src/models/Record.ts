import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface RecordAttributes {
  id: number;
  name: string;
  email: string;
  company: string;
  created_at?: Date;
}

interface RecordCreationAttributes extends Optional<RecordAttributes, 'id' | 'created_at'> {}

class Record extends Model<RecordAttributes, RecordCreationAttributes> implements RecordAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public company!: string;
  public created_at!: Date;
}

Record.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isEmail: true,
      },
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'records',
    timestamps: false,
  }
);

export default Record;
