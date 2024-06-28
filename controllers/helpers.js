const _ = require('lodash');

// Function to shuffle an array
function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

/**
 * Generates a final feed of posts for a user based on various parameters.
 * @param {Array} user_posts - List of user posts
 * @param {Array} script_feed - List of script (actor) posts
 * @param {Object} user - User document
 * @param {String} order - Order of posts in the final feed ('SHUFFLE' or 'CHRONOLOGICAL')
 * @param {Boolean} removeHarmfulContent - Indicates if harmful posts should be removed from the final feed
 * @param {Boolean} removedBlockedUserContent - Indicates if posts from blocked users should be removed
 * @returns {Array} finalfeed - Final feed of posts for the user
 */
exports.getFeed = function(user_posts, script_feed, user, order, removeHarmfulContent, removedBlockedUserContent) {
    let finalfeed = [];
    let finalfeed_seen = [];
    let finalfeed_unseen = [];
    let new_user_posts = [];

    while ((script_feed && script_feed.length) || (user_posts && user_posts.length)) {
        if (!script_feed || script_feed.length === 0 ||
            ((user_posts && user_posts.length > 0) && (script_feed[0]?.time < user_posts[0]?.relativeTime))) {

            if (user_posts[0]) {
                user_posts[0].comments = user_posts[0].comments.filter(comment => comment.absTime < Date.now());
                user_posts[0].comments.sort((a, b) => a.relativeTime - b.relativeTime);

                if ((Date.now() - user_posts[0].absTime) < 600000) {
                    new_user_posts.push(user_posts[0]);
                    user_posts.splice(0, 1);
                } else {
                    finalfeed.push(user_posts[0]);
                    user_posts.splice(0, 1);
                }
            } else {
                user_posts.splice(0, 1);
            }
        } else {
            if (script_feed[0]) {
                script_feed[0].comments = script_feed[0].comments.filter(comment => !comment.class || comment.class == user.experimentalCondition);
                script_feed[0].comments = script_feed[0].comments.filter(comment => user.createdAt.getTime() + comment.time < Date.now());

                const feedIndex = _.findIndex(user.feedAction, o => o.post && o.post.equals(script_feed[0].id));
                if (feedIndex !== -1 && script_feed[0].actor.username !== user.username) { // Check if post is not user's own
                    if (Array.isArray(user.feedAction[feedIndex].comments) && user.feedAction[feedIndex].comments) {
                        for (const commentObject of user.feedAction[feedIndex].comments) {
                            if (commentObject.new_comment) {
                                const cat = {
                                    commentID: commentObject.new_comment_id,
                                    body: commentObject.body,
                                    likes: commentObject.likes,
                                    time: commentObject.relativeTime,
                                    new_comment: commentObject.new_comment,
                                    liked: commentObject.liked
                                };
                                script_feed[0].comments.push(cat);
                            } else {
                                const commentIndex = _.findIndex(script_feed[0].comments, o => o.id == commentObject.comment);
                                if (commentIndex !== -1) {
                                    if (commentObject.liked) {
                                        script_feed[0].comments[commentIndex].liked = true;
                                    }
                                    if (commentObject.harmful) {
                                        script_feed[0].comments.splice(commentIndex, 1);
                                    }
                                }
                            }
                        }
                    }
                    script_feed[0].comments.sort((a, b) => a.time - b.time);

                    if (user.feedAction[feedIndex].liked) {
                        script_feed[0].like = true;
                        script_feed[0].likes++;
                    }
                    if (user.feedAction[feedIndex].harmTime && user.feedAction[feedIndex].harmTime[0]) {
                        if (removeHarmfulContent) {
                            script_feed.splice(0, 1);
                        } else {
                            script_feed[0].harmful = true;
                        }
                    } else if (user.blocked.includes(script_feed[0].actor.username) && removedBlockedUserContent) {
                        script_feed.splice(0, 1);
                    } else {
                        if (order == 'SHUFFLE') {
                            if (!user.feedAction[feedIndex].readTime || !user.feedAction[feedIndex].readTime[0]) {
                                finalfeed_unseen.push(script_feed[0]);
                            } else {
                                finalfeed_seen.push(script_feed[0]);
                            }
                        } else {
                            finalfeed.push(script_feed[0]);
                        }
                        script_feed.splice(0, 1);
                    }
                } else {
                    script_feed.splice(0, 1);
                }
            } else {
                script_feed.splice(0, 1);
            }
        }
    }

    if (order == 'SHUFFLE') {
        finalfeed_seen = shuffle(finalfeed_seen);
        finalfeed_unseen = shuffle(finalfeed_unseen);
        finalfeed = finalfeed_unseen.concat(finalfeed_seen);
    }

    finalfeed = new_user_posts.concat(finalfeed);
    return finalfeed;
};

/**
 * Reposts a post by creating a new post object based on the original post.
 * @param {Object} originalPost - The original post object to be reposted
 * @param {Object} user - The user reposting the post
 * @returns {Object} newPost - The newly created post object representing the reposted post
 */
exports.repostPost = function(originalPost, user) {
    // Example logic: Create a new post object based on the original post
    const newPost = {
        // Copy necessary fields from originalPost
        id: generateUniqueId(), // Generate a new unique ID for the reposted post
        content: originalPost.content, // Example: Copy content from originalPost
        time: Date.now(), // Example: Set current time as the repost time
        actor: user, // Example: Set the user as the actor reposting the post
        comments: [], // Initialize with no comments
        likes: 0, // Initialize with zero likes
        repostedFrom: originalPost.id // Reference to the original post ID
    };

    // Example: Save the new post object to the database or user's feed
    user.posts.push(newPost); // Add the new post to the user's posts array

    return newPost;
};

// Example function to generate a unique ID for the reposted post
function generateUniqueId() {
    // Example: Generate a unique ID using a library or method of choice
    return Math.random().toString(36).substr(2, 9); // Example: Generate a random alphanumeric string
}
