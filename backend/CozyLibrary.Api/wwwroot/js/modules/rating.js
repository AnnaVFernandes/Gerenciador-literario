import { $ } from "./utils.js";

let ratingInput;

export function paintStars(value) {
  document.querySelectorAll(".star-btn").forEach((s, index) => {
    s.classList.toggle("active", index < value);
  });
}

export function initRating() {
  const starsContainer = $("#rating-stars");
  ratingInput = $("#rating");
  if (!starsContainer || !ratingInput) return;

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = "star-btn";
    star.textContent = "★";
    star.dataset.value = i;
    star.setAttribute("aria-label", `${i} estrela${i > 1 ? "s" : ""}`);

    star.addEventListener("click", () => {
      const current = Number(ratingInput.value) || 0;
      if (current === i) {
        ratingInput.value = "";
        paintStars(0);
      } else {
        ratingInput.value = i;
        paintStars(i);
      }
    });

    star.addEventListener("mouseenter", () => paintStars(i));
    starsContainer.appendChild(star);
  }

  starsContainer.addEventListener("mouseleave", () => {
    paintStars(Number(ratingInput.value) || 0);
  });
}
