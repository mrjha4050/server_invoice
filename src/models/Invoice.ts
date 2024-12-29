// server/src/models/Invoice.ts
import mongoose,{Schema, Document} from "mongoose";
export interface Invoice extends Document {
    user : string;
    products : {name:string, quantity: number, rate: number, total: number, gst: number}[];
    totalAmount: number;
    date: Date;
}

const InvoiceSchema = new Schema<Invoice>({
    user: {type: String, required: true},
    products:[
        {
            name: {type: String, required: true},
            quantity: {type: Number, required: true},
            rate: {type: Number, required: true},
            total: {type: Number, required: true},
            gst: {type: Number, required: true}
        },
    ],
    totalAmount: {type: Number, required: true},
    date: {type: Date, required: true},
});

export default mongoose.model<Invoice>("Invoice", InvoiceSchema);