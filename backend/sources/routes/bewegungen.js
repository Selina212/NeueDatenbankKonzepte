//Author: Selina Steuer
import { Router } from "express";
import { ObjectId } from "mongodb";
import db from "../db/mongo.js";

const router = Router();

const bewegungen = db.collection("lagerbewegungen");
const produkte = db.collection("produkte");

// GET: Bewegungen mit Lagerort-Bezeichnung
router.get("/", async (req, res) => {
    try {
        const result = await bewegungen.aggregate([
            {
                $addFields: {
                    lagerort_id: { $toObjectId: "$lagerort_id" },
                    produkt_id: { $toObjectId: "$produkt_id" }
                }
            },
            {
                $lookup: {
                    from: "lagerorte",
                    localField: "lagerort_id",
                    foreignField: "_id",
                    as: "lagerort"
                }
            },
            { $unwind: "$lagerort" },
            {
                $lookup: {
                    from: "produkte",
                    localField: "produkt_id",
                    foreignField: "_id",
                    as: "produkt"
                }
            },
            { $unwind: "$produkt" },
            {
                $project: {
                    typ: 1,
                    menge: 1,
                    datum: 1,
                    grund: 1,
                    produkt_id: 1,
                    lagerort_id: 1,
                    lagerort_bezeichnung: "$lagerort.bezeichnung",
                    produkt_bezeichnung: "$produkt.bezeichnung"
                }
            }
        ]).toArray();

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





// POST: Bewegung anlegen
router.post("/", async (req, res) => {
    try {
        const { produkt_id, menge, typ, grund, lagerort_id } = req.body;

        const produkt = await produkte.findOne({ _id: new ObjectId(produkt_id) });
        if (!produkt) return res.status(400).json({ error: "Produkt existiert nicht" });

        if (typ === "Ausgang" && produkt.bestand < menge) {
            return res.status(400).json({ error: "Nicht genug Bestand" });
        }

        const neuerBestand =
            typ === "Eingang" ? produkt.bestand + menge : produkt.bestand - menge;

        await produkte.updateOne(
            { _id: new ObjectId(produkt_id) },
            { $set: { bestand: neuerBestand } }
        );

        const result = await bewegungen.insertOne({
            typ,
            menge,
            grund,
            produkt_id,
            lagerort_id,
            datum: new Date()
        });

        res.status(201).json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


export default router;
