import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// __dirname für ES Modules nachbauen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env absolut laden
dotenv.config({ path: path.join(__dirname, "../../.env") });

console.log("Geladener MONGO_URI:", process.env.MONGO_URI);

const client = new MongoClient(process.env.MONGO_URI);

await client.connect();
console.log("MongoDB verbunden!");

const db = client.db("lagerverwaltung");

export default db;
