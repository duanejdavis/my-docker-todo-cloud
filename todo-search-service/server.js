const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("@elastic/elasticsearch");
const envProps = require("./env_props");

/////// Test curl /////////////////////////////////////////////////////////////////////////
// curl --data "searchText=kids" http://localhost:3002/api/v1/search
///////////////////////////////////////////////////////////////////////////////////////////

// Initializing the Express Framework //////////////////////////////////////////////////////////////////////////////////
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Elasticsearch Client Setup //////////////////////////////////////////////////////////////////////////////////////////
const elasticClient = new Client({
  node: `http://${envProps.elasticHost}:${envProps.elasticPort}`,
});

// Ping the client to be sure Elastic is up
async function checkElasticsearch() {
  try {
    await elasticClient.ping();
    console.log("Elasticsearch client connected");
  } catch (error) {
    console.error("Something went wrong with Elasticsearch: " + error);
  }
}

checkElasticsearch();

// Set up the API routes ///////////////////////////////////////////////////////////////////////////////////////////////

const TODO_SEARCH_INDEX_NAME = "todos";

// Search all todos
app.route("/api/v1/search").post(async (req, res) => {
  const searchText = req.body.searchText;

  console.log("CALLED POST api/v1/search with searchText=" + searchText);

  try {
    // Perform the actual search (ES 8.x - no type parameter)
    const results = await elasticClient.search({
      index: TODO_SEARCH_INDEX_NAME,
      query: {
        match: {
          todotext: searchText,
        },
      },
    });

    console.log(
      'Search for "' +
        searchText +
        '" matched (' +
        results.hits.hits.length +
        ")"
    );
    res.send(results.hits.hits);
  } catch (err) {
    console.log("Search error:", err);
    res.send([]);
  }
});

// Start the server ////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
  console.log("Todo Search Service started!");
});
