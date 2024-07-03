function likePost(e) {
    const target = $(e.target).closest('.ui.like.button');
    const label = target.closest('.ui.fluid.card').find(".ui.basic.green.left.pointing.label.count");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const currDate = Date.now();
    const isUserPost = postClass === 'user_post';

    const url = isUserPost ? "/userPost_feed" : "/feed";

    console.log(`Liking post: ${postID}, isUserPost: ${isUserPost}, url: ${url}`);

    if (target.hasClass("red")) { // Unlike Post
        target.removeClass("red");
        label.html(function(i, val) { return val * 1 - 1 });

        $.post(url, {
            postID: postID,
            unlike: currDate,
            postClass: postClass,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        }).done(function(response) {
            console.log('Unlike response:', response);
            if (response.result !== 'success') {
                console.error('Failed to unlike post:', response.message);
                // Revert the UI change if the request failed
                target.addClass("red");
                label.html(function(i, val) { return val * 1 + 1 });
            }
        }).fail(function(error) {
            console.error('Error unliking post:', error);
            // Revert the UI change if the request failed
            target.addClass("red");
            label.html(function(i, val) { return val * 1 + 1 });
        });

    } else { // Like Post
        target.addClass("red");
        label.html(function(i, val) { return val * 1 + 1 });

        $.post(url, {
            postID: postID,
            like: currDate,
            postClass: postClass,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        }).done(function(response) {
            console.log('Like response:', response);
            if (response.result !== 'success') {
                console.error('Failed to like post:', response.message);
                // Revert the UI change if the request failed
                target.removeClass("red");
                label.html(function(i, val) { return val * 1 - 1 });
            }
        }).fail(function(error) {
            console.error('Error liking post:', error);
            // Revert the UI change if the request failed
            target.removeClass("red");
            label.html(function(i, val) { return val * 1 - 1 });
        });
    }
}

function markHarmful(e) {
    const target = $(e.target).closest('.ui.harmful.button');
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const currDate = Date.now();
    const isUserPost = postClass === 'user_post';

    const url = isUserPost ? "/userPost_feed" : "/feed";

    console.log(`Marking post as harmful: ${postID}, isUserPost: ${isUserPost}, url: ${url}`);

    $.post(url, {
        postID: postID,
        harmful: currDate,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    }).done(function(response) {
        console.log('Harmful response:', response);
        if (response.result !== 'success') {
            console.error('Failed to mark post as harmful:', response.message);
        }
    }).fail(function(error) {
        console.error('Error marking post as harmful:', error);
    });
}

// Bind the functions to the respective button click events
$(document).on('click', '.ui.like.button', likePost);
$(document).on('click', '.ui.harmful.button', markHarmful);
