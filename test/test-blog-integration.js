const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData() {
	console.info('Seeding blog post data');
	const seedData = [];

	for (let i=1; i<=10; i++) {
		seedData.push(generateBlogData());
	}

	return BlogPost.insertMany(seedData);
}

function generateBlogData() {
	return {
		author: {
			firstName: faker.name.firstName(), 
			lastName: faker.name.lastName()
		},
		title: faker.company.catchPhrase(),
		content: faker.lorem.paragraph(),
		created: faker.date.past()
	}
}

function tearDownDb() {
	console.warn('Deleting database.');
	return mongoose.connection.dropDatabase();
}

describe('Blog Post API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('GET endpoint', function() {

		it('should return all existing blog posts', function() {
			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res) {
					res = _res;
					res.should.have.status(200);
					res.body.should.have.length.of.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					res.body.should.have.length.of(count);
				});
		});

		it('should return blog posts with right fields', function() {
			let blogPost;
			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.an('array');
					res.body.should.have.length.of.at.least(1);

					res.body.forEach(function(post) {
						post.should.be.an('object');
						post.should.include.keys('author', 'created', 'id', 'content', 'title');
					});
					blogPost = res.body[0];
					return BlogPost.findById(blogPost.id);
				})
				.then(function(post) {
					blogPost.id.should.equal(post.id);
					//console.log(`Author name is full: ${blogPost.author}, first: ${blogPost.author.firstName}, and last: ${blogPost.author.lastName}`);
					blogPost.author.should.equal(`${post.author.firstName} ${post.author.lastName}`);
					blogPost.content.should.equal(post.content);
					blogPost.title.should.equal(post.title);
				});
		});

	});

	describe('POST endpoint', function() {
		it('should add a new post', function() {

			const newPost = generateBlogData();

			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res) {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.an('object');
					res.body.should.include.keys('author', 'created', 'id', 'content', 'title');
					res.body.id.should.not.be.null;
					res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
					res.body.created.should.not.be.null;
					res.body.content.should.equal(newPost.content);
					res.body.title.should.equal(newPost.title);
					

					return BlogPost.findById(res.body.id).exec();
				})
				.then(function(post) {
					// console.log('___POST___',Object.keys(post));
					post.should.be.an('object');
					// post.should.include.keys('author', 'created', '_id', 'content', 'title');
					post.id.should.not.be.null;
					post.author.firstName.should.equal(newPost.author.firstName);
					post.author.lastName.should.equal(newPost.author.lastName);
					post.created.should.not.be.null;
					post.content.should.equal(newPost.content);
					post.title.should.equal(newPost.title);
				});
		});		
	});

	describe('PUT endpoint', function() {
		it('should update fields you send over', function() {
			const updateData = {
				title: faker.company.catchPhrase(),
				content: faker.lorem.paragraph()
			};

			return BlogPost
			.findOne()
			.exec()
			.then(function(post) {
				updateData.id = post.id;

				return chai.request(app)
				.put(`/posts/${post.id}`)
				.send(updateData);
			})
			.then(function(res) {
				res.should.have.status(201);

				return BlogPost.findById(updateData.id).exec();
			})
			.then(function(post) {
				post.title.should.equal(updateData.title);
				post.content.should.equal(updateData.content);
			});
		});
	});

	describe('DELETE endpoint', function() {
		it('should delete a restaurant by id', function() {
			let post;

			return BlogPost
			.findOne()
			.exec()
			.then(function(blogPost) {
				post = blogPost;
				return chai.request(app).delete(`/posts/${post.id}`);
			})
			.then(function(res) {
				res.should.have.status(204);
				return BlogPost.findById(post.id).exec();
			})
			.then(function(blogPost) {
				should.not.exist(blogPost);
			});
		});
	});

});