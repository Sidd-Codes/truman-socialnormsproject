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

            // Process user_posts
            if (user_posts[0]) {
                // Check for conditions and filter as needed
                if ((Date.now() - user_posts[0].absTime) < 600000) {
                    new_user_posts.push(user_posts[0]);
                } else {
                    finalfeed.push(user_posts[0]);
                }
                user_posts.splice(0, 1);
            } else {
                user_posts.splice(0, 1);
            }

        } else {
            // Process script_feed
            if (script_feed[0]) {
                // Check conditions and filters
                const feedIndex = _.findIndex(user.feedAction, o => o.post && o.post.equals(script_feed[0].id));
                if (feedIndex !== -1) {
                    // Check additional conditions and filters
                    if (user.feedAction[feedIndex].harmTime && user.feedAction[feedIndex].harmTime[0] && removeHarmfulContent) {
                        script_feed.splice(0, 1);
                    } else if (user.blocked.includes(script_feed[0].actor.username) && removedBlockedUserContent) {
                        script_feed.splice(0, 1);
                    } else {
                        // Add to appropriate feed based on order
                        if (order === 'SHUFFLE') {
                            // Handle shuffle logic
                            finalfeed_unseen.push(script_feed[0]);
                        } else {
                            finalfeed.push(script_feed[0]);
                        }
                        script_feed.splice(0, 1);
                    }
                } else {
                    // Add to feed if not filtered out
                    if (!user.blocked.includes(script_feed[0].actor.username)) {
                        if (order === 'SHUFFLE') {
                            // Handle shuffle logic
                            finalfeed_unseen.push(script_feed[0]);
                        } else {
                            finalfeed.push(script_feed[0]);
                        }
                    }
                    script_feed.splice(0, 1);
                }
            } else {
                script_feed.splice(0, 1);
            }
        }
    }

    // Handle shuffle and final feed concatenation
    if (order === 'SHUFFLE') {
        finalfeed_seen = shuffle(finalfeed_seen);
        finalfeed_unseen = shuffle(finalfeed_unseen);
        finalfeed = finalfeed_unseen.concat(finalfeed_seen);
    }

    // Concatenate new_user_posts to finalfeed
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
