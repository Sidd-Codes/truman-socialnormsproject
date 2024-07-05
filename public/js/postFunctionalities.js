function likePost(e) {
    const target = $(e.target).closest('.ui.like.button');
    const label = target.closest('.ui.labeled.button').find(".ui.basic.green.left.pointing.label.count");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const currDate = Date.now();

    if (target.hasClass("green")) { // Unlike Post
        target.removeClass("green");
        label.html(function(i, val) { return parseInt(val) - 1 });

        $.post("/feed", {
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
        target.addClass("green");
        label.html(function(i, val) { return parseInt(val) + 1 });

        $.post("/feed", {
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

function markAsHarmful(e) {
    const target = $(e.target).closest('.ui.harmful.button');
    const post = target.closest(".ui.fluid.card");
    const postID = post.attr("postID");
    const postClass = post.attr("postClass");
    const flag = Date.now();

    $.post("/feed", {
        postID: postID,
        flag: flag,
        harmful: true, // Indicate that the post is harmful
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    }).done(function(response) {
        console.log("Marked as harmful successfully!");
        // Update button appearance
        target.addClass('red').prop('disabled', true);
    }).fail(function(error) {
        console.error("Error marking as harmful:", error);
    });
}

function repostPost(e) {
    const target = $(e.target).closest('.ui.repost.button');
    const post = target.closest(".ui.fluid.card");
    const postID = post.attr("postID");
    const postClass = post.attr("postClass");
    const currDate = Date.now();

    $.post("/feed", {
        postID: postID,
        repost: currDate,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    }).done(function(response) {
        // Assuming response contains updated number of reposts or any other relevant data
        // You can update the UI here if needed
        console.log("Repost successful!");
    }).fail(function(error) {
        console.error("Error reposting:", error);
    });
}

function followUser(e) {
    const target = $(e.target);
    const username = target.attr('actor_un');
    if (target.text().trim() == "Follow") { //Follow Actor
        $(`.ui.basic.primary.follow.button[actor_un='${username}']`).each(function(i, element) {
            const button = $(element);
            button.text("Following");
            button.prepend("<i class='check icon'></i>");
        })
        $.post("/user", {
            followed: username,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        })
    } else { //Unfollow Actor
        $(`.ui.basic.primary.follow.button[actor_un='${username}']`).each(function(i, element) {
            const button = $(element);
            button.text("Follow");
            button.find('i').remove();
        })
        $.post("/user", {
            unfollowed: username,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        })
    }
}

$(window).on('load', () => {
    // Add humanized time to all posts
    $('.right.floated.time.meta, .date').each(function() {
        const ms = parseInt($(this).text(), 10);
        const time = new Date(ms);
        $(this).text(humanized_time_span(time));
    });

    // ************ Actions on Main Post ***************
    // Focus new comment element if "Reply" button is clicked
    $('.reply.button').on('click', function() {
        let parent = $(this).closest(".ui.fluid.card");
        parent.find("textarea.newcomment").focus();
    });

    // Press enter to submit a comment
    $("textarea.newcomment").keydown(function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.stopImmediatePropagation();
            $(this).parents(".ui.form").siblings("i.big.send.link.icon").click();
        }
    });

    // Create a new Comment
    $("i.big.send.link.icon").on('click', addComment);

    // Like/Unlike Post
    $('.ui.like.button').on('click', likePost);

    // Mark as Harmful
    $('.ui.harmful.button').on('click', markAsHarmful);

    // Repost button
    $('.ui.repost.button').on('click', repostPost);

    // Follow button
    $('.ui.basic.primary.follow.button').on('click', followUser);

    // Track how long a post is on the screen (borders are defined by image)
    // Start time: When the entire photo is visible in the viewport.
    // End time: When the entire photo is no longer visible in the viewport.
    $('.ui.fluid.card .img.post').visibility({
        once: false,
        continuous: false,
        observeChanges: true,
        initialCheck: true,
        offset: 50,

        // Handling scrolling down like normal
        onBottomVisible: function(element) {
            var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
            if (element.topVisible) {
                if (startTime == 0) {
                    startTime = Date.now();
                }
            } else {
                startTime = 0;
            }
            $(this).siblings(".content").children(".myTimer").text(startTime);
        },

        // Element's bottom edge has passed top of the screen (disappearing); happens only when Scrolling Up
        onBottomPassed: function(element) {
            var endTime = Date.now();
            var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
            var totalViewTime = endTime - startTime;

            var parent = $(this).parents(".ui.fluid.card");
            var postID = parent.attr("postID");
            var postClass = parent.attr("postClass");
            
            if (totalViewTime < 86400000 && totalViewTime > 1500 && startTime > 0) {
                $.post("/feed", {
                    postID: postID,
                    viewed: totalViewTime,
                    postClass: postClass,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                $(this).siblings(".content").children(".myTimer").text(0);
            }
        },

        // Handling scrolling up
        onTopPassedReverse: function(element) {
            var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
            if (element.bottomVisible && startTime == 0) {
                startTime = Date.now();
                $(this).siblings(".content").children(".myTimer").text(startTime);
            }
        },

        // Called when topVisible turns false (exits from top or bottom)
        onTopVisibleReverse: function(element) {
            if (element.topPassed) {
            } else {
                var endTime = Date.now();
                var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
                var totalViewTime = endTime - startTime;

                var parent = $(this).parents(".ui.fluid.card");
                var postID = parent.attr("postID");
                var postClass = parent.attr("postClass");
                
                if (totalViewTime < 86400000 && totalViewTime > 1500 && startTime > 0) {
                    $.post("/feed", {
                        postID: postID,
                        viewed: totalViewTime,
                        postClass: postClass,
                        _csrf: $('meta[name="csrf-token"]').attr('content')
                    });
                    $(this).siblings(".content").children(".myTimer").text(0);
                }
            }
        }
    });
});
