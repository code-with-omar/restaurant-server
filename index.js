const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
//port
const port = process.env.PORT || 5000
// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        // await client.connect();
        const userCollection = client.db("bistroDB").collection("users")
        const reviewCollection = client.db("bistroDB").collection("reviews")
        const userReviewCollection = client.db("bistroDB").collection("userReviews")
        const menuCollection = client.db("bistroDB").collection("menu")
        const chefRecommendCollection = client.db("bistroDB").collection("chefMenu")
        const cartsCollection = client.db("bistroDB").collection("carts")
        const reservationCollection = client.db("bistroDB").collection("reservation")

        //JWT related API
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })
        //middle for jwt
        const verifyToken = (req, res, next) => {

            // console.log('Inside verify token', req.body)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            // console.log(token)

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded
                // console.log(req.decoded)
                next()
            })
        }
        // middlewere for verify Admin after verify token
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await userCollection.find(query).toArray()
            const isAdmin = user[0]?.role === 'admin'
            // console.log(user)
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }
        //Get review
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })
        // user reviews individual product
        app.post("/addReviews", verifyToken, async (req, res) => {
            const review = req.body;
            const result = await userReviewCollection.insertOne(review)
            res.send(result)
        })
        //Get menu
        app.get('/menu', async (req, res) => {
            const cursor = menuCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })
        // admin find specific menu
        app.get('/menu/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await menuCollection.findOne(query);
            res.send(result)
        })
        // Update menu only admin
        app.patch('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
            const item = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateMenu = {
                $set: {
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    recipe: item.recipe
                }
            }
            const result = await menuCollection.updateOne(filter, updateMenu)
            res.send(result)
        })
        // add menu by admin
        app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
            const menuItem = req.body;
            const result = await menuCollection.insertOne(menuItem);
            res.send(result)
        })

        // delete by admin
        app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await menuCollection.deleteOne(query);
            res.send(result);
        });

        // get chef recommend collection
        app.get('/suggest', async (req, res) => {
            const cursor = chefRecommendCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })
        // users related api

        app.post('/users', async (req, res) => {

            // insert email if user doesn't exists: 
            // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });
        // user reservation
        app.post('/reservation', verifyToken, async (req, res) => {
            const reservations = req.body
            const result = await reservationCollection.insertOne(reservations);
            res.send(result)
        })
        // find users reservation
        // app.get('/reservation', async (req, res) => {
        //     const user = req.body;
        //     const query = { email: user.email }
        //     const cursor = await reservationCollection.findOne(query)
        //     const result = await cursor.toArray();
        //     res.send(result)
        // })
        app.get('/reservation', verifyToken, async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const cursor = reservationCollection.find(query);
            const result = await cursor.toArray()
            res.send(result);
        })
        app.get('/findAllReservation', async (req, res) => {
            const cursor = reservationCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.delete('/reservation/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await reservationCollection.deleteOne(query)
            res.send(result)
        })
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {

            const cursor = userCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })
        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })
        // make admin by admin
        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)

        })
        //check admin
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query)
            let admin = false
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin })
        })
        //
        app.get('/carts', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const cursor = cartsCollection.find(query);
            const result = await cursor.toArray()
            res.send(result);
        })
        // it seen all order by admin
        app.get('/allCarts', verifyToken, verifyAdmin, async (req, res) => {
            const cursor = cartsCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })

        // Cartts collection
        app.post('/carts', async (req, res) => {
            const cartItem = req.body;
            const result = await cartsCollection.insertOne(cartItem);
            res.send(result)
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartsCollection.deleteOne(query)
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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