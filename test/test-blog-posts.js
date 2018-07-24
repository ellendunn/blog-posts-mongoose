const chai = require('chai');
const chaiHttp = require('chai-http');

const { app, runServer, closeServer} = require('../server');
const { DATABASE_URL_TEST } = require('../config');

console.log('DATABASE_URL_TEST', DATABASE_URL_TEST);

const expect = chai.expect;

chai.use(chaiHttp);

describe ("BlogPost", function() {
	before(function() {
		return runServer(DATABASE_URL_TEST);
	});

	after(function() {
		return closeServer();
	});


	it("should list blog post on GET", function() {
		return chai
		.request(app)
		.get("/posts")
		.then(function(res) {
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.be.a("object");
			console.log(res.body);
			// expect(res.body.length).to.be.at.least(1);
			const expectedKeys = ["id", "title", "content", "author"];
			res.body.forEach(function(item) {
				expect(item).to.be.a("object");
				expect(item).to.include.keys(expectedKeys)
			});
		});
	});

	it("should add a blog post on POST", function() {
		const newPost = {
			title: "My Trip to Africa",
			content: "content content content",
			author: {
				firstName: "Ellen",
				lastName: "Dunn"
			}
			// created: "July 19, 2018"
		};
		return chai
		.request(app)
		.post("/posts")
		.send(newPost)
		.then(function(res){
			expect(res).to.have.status(201);
			expect(res).to.be.json;
			expect(res.body).to.include.keys("id", "title", "content", "author.firstName", "author.lastName");
			expect(res.body.id).to.not.equal(null);
			expect(res.body).to.deep.equal(
				Object.assign(newPost, {id:res.body.id})
			)
		});
	});

	it("should edit a post on PUT", function() {
		const updateData = {
			title: "How I Kept My Cactus Alive",
			content: "content content content",
			author: {
				firstName: "Ellen",
				lastName: "Dunn"
			}
			// created: "July 18, 2018"
		};
		return (
			chai
			.request(app)
			.get("/posts")
			.then(function(res){
				updateData.id = res.body[0].id
				return chai
				.request(app)
				.put(`/posts/${updateData.id}`)
				.send(updateData)
			})
			.then(function(res){
				expect(res).to.have.status(204);
				expect(res).to.be.json;
				expect(res.body).to.be.a("object");
			})
		);
	});

	it("should delete a post on DELETE", function(){
		return (
			chai
			.request(app)
			.get("/posts")
			.then(function(res){
				return chai
				.request(app)
				.delete(`/posts/${res.body[0].id}`)
			})
			.then(function(res){
				expect(res).to.have.status(204)
			})
		);
	});
})
