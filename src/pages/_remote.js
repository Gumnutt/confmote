import { createClient } from "@supabase/supabase-js"
import { reactionMap } from "../scripts/interactions/interactions-map.js"
import { sendMessageEvent } from "../scripts/interactions/events.js"

const randomInRange = (min, max) => Math.random() * (max - min + 1) + min

class Remote {
  constructor(options) {
    const that = this
    that.options = options
    that.element = options.element
    that.bootstrap()
    return this
  }
  async bootstrap() {
    const that = this
    await that.connect()
    that.cacheElements()
    that.bindEvents()
    that.calibrateInteractions()
    that.elements.reactionBar.style.display = "flex"
  }
  cacheElements() {
    const that = this
    that.elements = {}
    // Reaction Bar
    that.elements.reactionBar = document.querySelector(".reactions")
  }
  prepopulateName() {
    const that = this
    that.elements.messageName.value = window.localStorage.getItem("jhey-remote-name") || ""
  }
  calibrateInteractions() {
    const that = this
    const INTERACTIONS = that.elements.reactionBar.querySelectorAll("button")

    INTERACTIONS.forEach((INTERACTION) => {
      const key = INTERACTION.dataset.interactionKey
    })
  }
  bindEvents() {
    const that = this
    that.elements.reactionBar.addEventListener("click", (event) => {
      const clicked = event.target.closest("button")

      if (clicked && !clicked.disabled) {
        const interactionKey = clicked.dataset.interactionKey
        console.log(interactionKey)
        const { action, emoji } = reactionMap[interactionKey]
        console.log(action)
        console.log(emoji)

        const REACTION_EMOJI = Object.assign(document.createElement("span"), {
          innerText: emoji,
          className: "interaction__interaction",
          ariaHidden: true,
          style: `
            --rotation: ${randomInRange(-45, 45)};
            --speed: ${randomInRange(1, 1.25)};
          `,
        })

        console.log(REACTION_EMOJI)

        REACTION_EMOJI.addEventListener("animationend", () => {
          REACTION_EMOJI.remove()
        })

        clicked.appendChild(REACTION_EMOJI)
        console.log(that)
        that.channel.send(action)
      }
    })
  }
  async connect() {
    const that = this
    const supabase = createClient(that.options.supabaseUrl, that.options.supabaseKey)
    let { data: Decks, error: DecksError } = await supabase.from("decks").select("*").eq("id", that.options.deckId)
    if (Decks.length === 0) return
    that.deckData = Decks[0]
    that.channel = supabase.channel(that.options.supabaseChannel)
    console.log("channel", that.channel)
    that.channel.on("postgres_changes", { event: "*", schema: "public", table: "decks" }, (event) => {
      if (event.eventType === "UPDATE") {
        that.deckData = event.new
        that.calibrateInteractions()
      }
    })
    await that.channel.subscribe()
    console.info(`Admin Remote:: Connected to DeckBase!`)
  }
}

new Remote({
  element: document.querySelector("main"),
  supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL,
  supabaseKey: import.meta.env.PUBLIC_SUPABASE_KEY,
  supabaseChannel: import.meta.env.PUBLIC_SUPABASE_CHANNEL,
  deckId: import.meta.env.PUBLIC_DECK_ID,
})
