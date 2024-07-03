function likePost(e) {
    const target = $(e.target).closest('.ui.like.button');
    const label = target.closest('.ui.fluid.card').find(".ui.basic.green.left.pointing.label.count");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const currDate = Date.now();
    const isUserPost = postClass === 'user_post';

    const url = isUserPost ? "/userPost_feed" : "/feed";

    if (target.hasClass("red")) { // Unlike Post
        target.removeClass("red");
        label.html(function(i, val) { return val * 1 - 1 });

        $.post(url, {
            postID: postID,
            unlike: currDate,
            postClass: postClass,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        }).done(function(response) {
            // Update UI if necessary
        }).fail(function(error) {
            console.error('Error unliking post:', error);
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
            // Update UI if necessary
        }).fail(function(error) {
            console.error('Error liking post:', error);
        });
    }
}
