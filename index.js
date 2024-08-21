const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
//port
const port = process.env.PORT || 5000
// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yziu76d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const reviewCollection = client.db("bistroDB").collection("reviews")
        const menuCollection = client.db("bistroDB").collection("menu")
        const chefRecommendCollection = client.db("bistroDB").collection("chefMenu")
        const cartsCollection = client.db("bistroDB").collection("carts")
        //Get review
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })
        //Get menu
        app.get('/menu', async (req, res) => {
            const cursor = menuCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })
        // get chef recommend collection
        app.get('/suggest', async (req, res) => {
            const cursor = chefRecommendCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/carts', async (req, res) => {
            const email=req.query.email
            const query={email:email}
            const cursor = cartsCollection.find(query);
            const result = await cursor.toArray()
            res.send(result);
        })
        // delete carts

        // Cartts collection
        app.post('/carts', async (req, res) => {
            const cartItem = req.body;
            const result = await cartsCollection.insertOne(cartItem);
            res.send(result)
        })

        app.delete('/carts/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id:new Object(id)}
            const result =await cartsCollection.deleteOne(query)
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello I am from server')
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})