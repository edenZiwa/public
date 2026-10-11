document.addEventListener(
    "DOMContentLoaded",
    () => {

        const entries =
        Array.from(
            document.querySelectorAll(".gallery-entry")
        );

        const filters =
        document.querySelectorAll(".gallery-filter");

        const search =
        document.getElementById("gallerySearch");

        const empty =
        document.getElementById("galleryEmpty");

        const loadMore =
        document.getElementById("loadMore");

        let activeFilter = "all";

        let searchTerm = "";

        let visibleLimit = 8;

        let currentIndex = 0;


        function updateGallery() {

            const filtered =
            entries.filter(entry => {

                const categoryMatch =
                activeFilter === "all" ||
                entry.dataset.category === activeFilter;


                const title =
                entry.dataset.title
                .toLowerCase();


                const searchMatch =
                !searchTerm ||
                title.includes(searchTerm);


                return categoryMatch && searchMatch;

            });


            entries.forEach(entry => {

                entry.classList.add("gallery-hidden");

            });


            filtered
            .slice(0, visibleLimit)
            .forEach(entry => {

                entry.classList.remove("gallery-hidden");

            });


            empty.classList.toggle(
                "d-none",
                filtered.length !== 0
            );


            loadMore.classList.toggle(
                "d-none",
                filtered.length <= visibleLimit
            );

        }


        filters.forEach(filter => {

            filter.addEventListener(
                "click",
                () => {

                    activeFilter =
                    filter.dataset.filter;

                    visibleLimit = 8;


                    filters.forEach(button => {

                        button.classList.remove("active");

                    });


                    filter.classList.add("active");

                    updateGallery();

                }
            );

        });


        search.addEventListener(
            "input",
            () => {

                searchTerm =
                search.value
                .trim()
                .toLowerCase();

                visibleLimit = 8;

                updateGallery();

            }
        );

        loadMore.addEventListener(
            "click",
            () => {

                visibleLimit += 4;

                updateGallery();

            }
        );


        const lightbox =
        document.getElementById(
            "galleryLightbox"
        );

        const lightboxImage =
        document.getElementById(
            "lightboxImage"
        );

        const lightboxTitle =
        document.getElementById(
            "lightboxTitle"
        );

        const lightboxCategory =
        document.getElementById(
            "lightboxCategory"
        );

        const lightboxDate =
        document.getElementById(
            "lightboxDate"
        );

        const lightboxLocation =
        document.getElementById(
            "lightboxLocation"
        );


        const visibleEntries =
        () =>
        entries.filter(entry =>
            !entry.classList.contains(
                "gallery-hidden"
            )
        );


        function showLightbox(index) {

            const visible =
            visibleEntries();

            if (!visible.length) return;


            currentIndex =
            (index + visible.length) %
            visible.length;


            const entry =
            visible[currentIndex];


            lightboxImage.src =
            entry.dataset.image;

            lightboxImage.alt =
            entry.dataset.title;

            lightboxTitle.textContent =
            entry.dataset.title;

            lightboxCategory.textContent =
            entry.dataset.category;

            lightboxDate.textContent =
            entry.dataset.date;

            lightboxLocation.textContent =
            entry.dataset.location;


            lightbox.classList.add("show");

            lightbox.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.classList.add(
                "overflow-hidden"
            );

        }



        entries.forEach(entry => {

            const button =
            entry.querySelector(
                ".gallery-open"
            );


            button.addEventListener(
                "click",
                () => {

                    const visible =
                    visibleEntries();

                    const index =
                    visible.indexOf(entry);

                    showLightbox(index);

                }
            );

        });


        document
        .getElementById("lightboxClose")
        .addEventListener(
            "click",
            closeLightbox
        );


        document
        .getElementById("lightboxPrev")
        .addEventListener(
            "click",
            () => {

                showLightbox(
                    currentIndex - 1
                );

            }
        );


        document
        .getElementById("lightboxNext")
        .addEventListener(
            "click",
            () => {

                showLightbox(
                    currentIndex + 1
                );

            }
        );


        lightbox.addEventListener(
            "click",
            event => {

                if (
                    event.target === lightbox
                ) {

                    closeLightbox();

                }

            }
        );


        function closeLightbox() {

            lightbox.classList.remove(
                "show"
            );

            lightbox.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.classList.remove(
                "overflow-hidden"
            );

            lightboxImage.src = "";

        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    !lightbox.classList.contains(
                        "show"
                    )
                ) return;


                if (event.key === "Escape") {

                    closeLightbox();

                }


                if (
                    event.key === "ArrowLeft"
                ) {

                    showLightbox(
                        currentIndex - 1
                    );

                }


                if (
                    event.key === "ArrowRight"
                ) {

                    showLightbox(
                        currentIndex + 1
                    );

                }

            }
        );


        const videoModalElement =
        document.getElementById(
            "videoModal"
        );

        const videoModal =
        new bootstrap.Modal(
            videoModalElement
        );

        const storyVideo =
        document.getElementById(
            "storyVideo"
        );


        document
        .querySelectorAll(".video-play")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    storyVideo.src =
                    button.dataset.video;

                    videoModal.show();

                    storyVideo.play()
                    .catch(() => {});

                }
            );

        });


        videoModalElement.addEventListener(
            "hidden.bs.modal",
            () => {

                storyVideo.pause();

                storyVideo.removeAttribute(
                    "src"
                );

                storyVideo.load();

            }
        );


        updateGallery();

    }
);