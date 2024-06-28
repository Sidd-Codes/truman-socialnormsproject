const Script = require('../models/Script');
const User = require('../models/User');
const Notification = require('../models/Notification');
const helpers = require('./helpers');
const _ = require('lodash');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

// Other existing code...

/*
 * Post /post/new
 * Record a new user-made post. Include any actor replies (comments) that go along with it.
 */
exports.newPost = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).exec();
        if (req.file) {
            user.numPosts = user.numPosts + 1; // Count begins at 0
            const currDate = Date.now();

            let post = {
                type: "user_post",
                postID: user.numPosts,
                body: req.body.body,
                picture: req.file.filename,
                liked: false,
                likes: 0,
                comments: [],
                reposts: [],
                harmful: [], // Initialize harmful array
                absTime: currDate,
                relativeTime: currDate - user.createdAt,
            };

            // Find any Actor replies (comments) that go along with this post
            const actor_replies = await Notification.find()
                .where('userPostID').equals(post.postID)
                .where('notificationType').equals('reply')
                .populate('actor').exec();

            // If there are Actor replies (comments) that go along with this post, add them to the user's post.
            if (actor_replies.length > 0) {
                for (const reply of actor_replies) {
                    user.numActorReplies = user.numActorReplies + 1; // Count begins at 0
                    const tmp_actor_reply = {
                        actor: reply.actor._id,
                        body: reply.replyBody,
                        commentID: user.numActorReplies,
                        relativeTime: post.relativeTime + reply.time,
                        absTime: new Date(user.createdAt.getTime() + post.relativeTime + reply.time),
                        new_comment: false,
                        liked: false,
                        likes: 0
                    };
                    post.comments.push(tmp_actor_reply);
                }
            }
            user.posts.unshift(post); // Add most recent user-made post to the beginning of the array
            await user.save();
            res.redirect('/');
        } else {
            req.flash('errors', { msg: 'ERROR: Your post did not get sent. Please include a photo and a caption.' });
            res.redirect('/');
        }
    } catch (err) {
        next(err);
    }
};

/**
 * POST /feed/
 * Record user's actions on ACTOR posts. 
 */
exports.postUpdateFeedAction = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).exec();
        // Check if user has interacted with the post before.
        let feedIndex = _.findIndex(user.feedAction, function (o) { return o.post == req.body.postID; });

        // If the user has not interacted with the post before, add the post to user.feedAction.
        if (feedIndex == -1) {
            const cat = {
                post: req.body.postID,
                postClass: req.body.postClass,
            };
            feedIndex = user.feedAction.push(cat) - 1;
        }

        // User created a new comment on the post.
        if (req.body.new_comment) {
            user.numComments = user.numComments + 1;
            const cat = {
                new_comment: true,
                new_comment_id: user.numComments,
                body: req.body.comment_text,
                relativeTime: req.body.new_comment - user.createdAt,
                absTime: req.body.new_comment,
                liked: false,
            }
            user.feedAction[feedIndex].comments.push(cat);
        }
        // User interacted with a comment on the post.
        else if (req.body.commentID) {
            const isUserComment = (req.body.isUserComment == 'true');
            // Check if user has interacted with the comment before.
            let commentIndex = (isUserComment) ?
                _.findIndex(user.feedAction[feedIndex].comments, function (o) {
                    return o.new_comment_id == req.body.commentID && o.new_comment == isUserComment
                }) :
                _.findIndex(user.feedAction[feedIndex].comments, function (o) {
                    return o.comment == req.body.commentID && o.new_comment == isUserComment
                });

            // If the user has not interacted with the comment before, add the comment to user.feedAction[feedIndex].comments
            if (commentIndex == -1) {
                const cat = {
                    comment: req.body.commentID
                };
                user.feedAction[feedIndex].comments.push(cat);
                commentIndex = user.feedAction[feedIndex].comments.length - 1;
            }

            // User liked the comment.
            if (req.body.like) {
                const like = req.body.like;
                user.feedAction[feedIndex].comments[commentIndex].likeTime.push(like);
                user.feedAction[feedIndex].comments[commentIndex].liked = true;
                if (req.body.isUserComment != 'true') user.numCommentLikes++;
            }

            // User unliked the comment.
            if (req.body.unlike) {
                const unlike = req.body.unlike;
                user.feedAction[feedIndex].comments[commentIndex].unlikeTime.push(unlike);
                user.feedAction[feedIndex].comments[commentIndex].liked = false;
                if (req.body.isUserComment != 'true') user.numCommentLikes--;
            }
        }
        // User interacted with the post.
        else {
            // User liked the post.
            if (req.body.like) {
                const like = req.body.like;
                user.feedAction[feedIndex].likeTime.push(like);
                user.feedAction[feedIndex].liked = true;
                user.numPostLikes++;
            }
            // User unliked the post.
            else if (req.body.unlike) {
                const unlike = req.body.unlike;
                user.feedAction[feedIndex].unlikeTime.push(unlike);
                user.feedAction[feedIndex].liked = false;
                user.numPostLikes--;
            }
            // User read the post.
            else if (req.body.viewed) {
                const view = req.body.viewed;
                user.feedAction[feedIndex].readTime.push(view);
                user.feedAction[feedIndex].rereadTimes++;
                user.feedAction[feedIndex].mostRecentTime = Date.now();
            } else {
                console.log('Something in feedAction went crazy. You should never see this.');
            }
        }
        await user.save();
        res.send({ result: "success", numComments: user.numComments });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /userPost_feed/
 * Record user's actions on USER posts, including reposting.
 */
exports.postUpdateUserPostFeedAction = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).exec();
        // Find the index of object in user.posts
        let feedIndex = _.findIndex(user.posts, function (o) { return o.postID == req.body.postID; });

        if (feedIndex == -1) {
            // Handle case where post is not found (though it should not happen)
            res.send({ result: "error", message: "Post not found" });
            return;
        }

        // User reposted the post.
        if (req.body.repost) {
            const currDate = Date.now();
            const repost = {
                reposted: true,
                repostTime: currDate
            };
            user.posts[feedIndex].reposts.push(repost);
        }
        // User created a new comment on the post.
        else if (req.body.new_comment) {
            user.numComments = user.numComments + 1;
            const cat = {
                body: req.body.comment_text,
                commentID: user.numComments,
                relativeTime: req.body.new_comment - user.createdAt,
                absTime: req.body.new_comment,
                new_comment: true,
                liked: false,
                likes: 0
            }
            user.posts[feedIndex].comments.push(cat);
        }
        // User interacted with a comment on the post.
        else if (req.body.commentID) {
            const isUserComment = (req.body.isUserComment == 'true');
            // Check if user has interacted with the comment before.
            let commentIndex = (isUserComment) ?
                _.findIndex(user.posts[feedIndex].comments, function (o) {
                    return o.commentID == req.body.commentID && o.new_comment == isUserComment
                }) :
                _.findIndex(user.posts[feedIndex].comments, function (o) {
                    return o.commentID == req.body.commentID && o.new_comment == isUserComment
                });

            // If the user has not interacted with the comment before, add the comment to user.posts[feedIndex].comments
            if (commentIndex == -1) {
                const cat = {
                    comment: req.body.commentID
                };
                user.posts[feedIndex].comments.push(cat);
                commentIndex = user.posts[feedIndex].comments.length - 1;
            }

            // User liked the comment.
            if (req.body.like) {
                const like = req.body.like;
                user.posts[feedIndex].comments[commentIndex].likeTime.push(like);
                user.posts[feedIndex].comments[commentIndex].liked = true;
                if (req.body.isUserComment != 'true') user.numCommentLikes++;
            }

            // User unliked the comment.
            if (req.body.unlike) {
                const unlike = req.body.unlike;
                user.posts[feedIndex].comments[commentIndex].unlikeTime.push(unlike);
                user.posts[feedIndex].comments[commentIndex].liked = false;
                if (req.body.isUserComment != 'true') user.numCommentLikes--;
            }
        }
        // User interacted with the post.
        else {
            // User liked the post.
            if (req.body.like) {
                const like = req.body.like;
                user.posts[feedIndex].likeTime.push(like);
                user.posts[feedIndex].liked = true;
                user.numPostLikes++;
            }
            // User unliked the post.
            else if (req.body.unlike) {
                const unlike = req.body.unlike;
                user.posts[feedIndex].unlikeTime.push(unlike);
                user.posts[feedIndex].liked = false;
                user.numPostLikes--;
            }
            // User read the post.
            else if (req.body.viewed) {
                const view = req.body.viewed;
                user.posts[feedIndex].readTime.push(view);
                user.posts[feedIndex].rereadTimes++;
                user.posts[feedIndex].mostRecentTime = Date.now();
            } else {
                console.log('Something in feedAction went crazy. You should never see this.');
            }
        }
        await user.save();
        res.send({ result: "success", numComments: user.numComments });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /repost
 * Record a repost action
 */
exports.postRepost = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).exec();
        const postID = req.body.postID;
        const postClass = req.body.postClass;
        const relativeTime = Date.now() - user.createdAt;

        let post = user.posts.id(postID);
        if (post) {
            post.reposts.push({
                userID: req.user.id,
                time: relativeTime
            });
            await user.save();
            res.send({ result: "success", message: "Post reposted successfully." });
        } else {
            res.send({ result: "error", message: "Post not found." });
        }
    } catch (err) {
        next(err);
    }
};

/**
 * POST /harmful
 * Record a harmful action
 */
exports.postHarmful = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).exec();
        const postID = req.body.postID;
        const relativeTime = Date.now() - user.createdAt;

        let post = user.posts.id(postID);
        if (post) {
            post.harmful.push({
                userID: req.user.id,
                time: relativeTime
            });
            await user.save();
            res.send({ result: "success", message: "Harmful action recorded successfully." });
        } else {
            res.send({ result: "error", message: "Post not found." });
        }
    } catch (err) {
        next(err);
    }
};
