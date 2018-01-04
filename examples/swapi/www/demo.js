console.log("Loading swapi ... ")

const createReport = require('../../../lib/main-buff').default

var data = {
  "allFilms": {
    "films": [
      {
        "title": "A New Hope",
        "releaseDate": "1977-05-25",
        "director": "George Lucas",
        "producers": [
          "Gary Kurtz",
          "Rick McCallum"
        ],
        "openingCrawl": "It is a period of civil war.\r\nRebel spaceships, striking\r\nfrom a hidden base, have won\r\ntheir first victory against\r\nthe evil Galactic Empire.\r\n\r\nDuring the battle, Rebel\r\nspies managed to steal secret\r\nplans to the Empire's\r\nultimate weapon, the DEATH\r\nSTAR, an armored space\r\nstation with enough power\r\nto destroy an entire planet.\r\n\r\nPursued by the Empire's\r\nsinister agents, Princess\r\nLeia races home aboard her\r\nstarship, custodian of the\r\nstolen plans that can save her\r\npeople and restore\r\nfreedom to the galaxy....",
        "characterConnection": {
          "characters": [
            {
              "name": "Luke Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "C-3PO",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R2-D2",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Darth Vader",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "TIE Advanced x1",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Leia Organa",
              "species": null,
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Owen Lars",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Beru Whitesun lars",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R5-D4",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Biggs Darklighter",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Obi-Wan Kenobi",
              "species": null,
              "homeworld": {
                "name": "Stewjon"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Belbullab-22 starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Wilhuff Tarkin",
              "species": null,
              "homeworld": {
                "name": "Eriadu"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Chewbacca",
              "species": {
                "name": "Wookie"
              },
              "homeworld": {
                "name": "Kashyyyk"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "Han Solo",
              "species": null,
              "homeworld": {
                "name": "Corellia"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "Greedo",
              "species": {
                "name": "Rodian"
              },
              "homeworld": {
                "name": "Rodia"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Jabba Desilijic Tiure",
              "species": {
                "name": "Hutt"
              },
              "homeworld": {
                "name": "Nal Hutta"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Wedge Antilles",
              "species": null,
              "homeworld": {
                "name": "Corellia"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Jek Tono Porkins",
              "species": null,
              "homeworld": {
                "name": "Bestine IV"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Raymus Antilles",
              "species": null,
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            }
          ]
        }
      },
      {
        "title": "The Empire Strikes Back",
        "releaseDate": "1980-05-17",
        "director": "Irvin Kershner",
        "producers": [
          "Gary Kurtz",
          "Rick McCallum"
        ],
        "openingCrawl": "It is a dark time for the\r\nRebellion. Although the Death\r\nStar has been destroyed,\r\nImperial troops have driven the\r\nRebel forces from their hidden\r\nbase and pursued them across\r\nthe galaxy.\r\n\r\nEvading the dreaded Imperial\r\nStarfleet, a group of freedom\r\nfighters led by Luke Skywalker\r\nhas established a new secret\r\nbase on the remote ice world\r\nof Hoth.\r\n\r\nThe evil lord Darth Vader,\r\nobsessed with finding young\r\nSkywalker, has dispatched\r\nthousands of remote probes into\r\nthe far reaches of space....",
        "characterConnection": {
          "characters": [
            {
              "name": "Luke Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "C-3PO",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R2-D2",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Darth Vader",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "TIE Advanced x1",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Leia Organa",
              "species": null,
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Obi-Wan Kenobi",
              "species": null,
              "homeworld": {
                "name": "Stewjon"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Belbullab-22 starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Chewbacca",
              "species": {
                "name": "Wookie"
              },
              "homeworld": {
                "name": "Kashyyyk"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "Han Solo",
              "species": null,
              "homeworld": {
                "name": "Corellia"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "Wedge Antilles",
              "species": null,
              "homeworld": {
                "name": "Corellia"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Yoda",
              "species": {
                "name": "Yoda's species"
              },
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Palpatine",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Boba Fett",
              "species": null,
              "homeworld": {
                "name": "Kamino"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Slave 1",
                    "crew": "1",
                    "passengers": "6"
                  }
                ]
              }
            },
            {
              "name": "IG-88",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Bossk",
              "species": {
                "name": "Trandoshan"
              },
              "homeworld": {
                "name": "Trandosha"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Lando Calrissian",
              "species": null,
              "homeworld": {
                "name": "Socorro"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  }
                ]
              }
            },
            {
              "name": "Lobot",
              "species": null,
              "homeworld": {
                "name": "Bespin"
              },
              "starshipConnection": {
                "starships": []
              }
            }
          ]
        }
      },
      {
        "title": "Return of the Jedi",
        "releaseDate": "1983-05-25",
        "director": "Richard Marquand",
        "producers": [
          "Howard G. Kazanjian",
          "George Lucas",
          "Rick McCallum"
        ],
        "openingCrawl": "Luke Skywalker has returned to\r\nhis home planet of Tatooine in\r\nan attempt to rescue his\r\nfriend Han Solo from the\r\nclutches of the vile gangster\r\nJabba the Hutt.\r\n\r\nLittle does Luke know that the\r\nGALACTIC EMPIRE has secretly\r\nbegun construction on a new\r\narmored space station even\r\nmore powerful than the first\r\ndreaded Death Star.\r\n\r\nWhen completed, this ultimate\r\nweapon will spell certain doom\r\nfor the small band of rebels\r\nstruggling to restore freedom\r\nto the galaxy...",
        "characterConnection": {
          "characters": [
            {
              "name": "Luke Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "C-3PO",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R2-D2",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Darth Vader",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "TIE Advanced x1",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Leia Organa",
              "species": null,
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Obi-Wan Kenobi",
              "species": null,
              "homeworld": {
                "name": "Stewjon"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Belbullab-22 starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Chewbacca",
              "species": {
                "name": "Wookie"
              },
              "homeworld": {
                "name": "Kashyyyk"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "Han Solo",
              "species": null,
              "homeworld": {
                "name": "Corellia"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "Jabba Desilijic Tiure",
              "species": {
                "name": "Hutt"
              },
              "homeworld": {
                "name": "Nal Hutta"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Wedge Antilles",
              "species": null,
              "homeworld": {
                "name": "Corellia"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Yoda",
              "species": {
                "name": "Yoda's species"
              },
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Palpatine",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Boba Fett",
              "species": null,
              "homeworld": {
                "name": "Kamino"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Slave 1",
                    "crew": "1",
                    "passengers": "6"
                  }
                ]
              }
            },
            {
              "name": "Lando Calrissian",
              "species": null,
              "homeworld": {
                "name": "Socorro"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  }
                ]
              }
            },
            {
              "name": "Ackbar",
              "species": {
                "name": "Mon Calamari"
              },
              "homeworld": {
                "name": "Mon Cala"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Mon Mothma",
              "species": null,
              "homeworld": {
                "name": "Chandrila"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Arvel Crynyd",
              "species": null,
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "A-wing",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Wicket Systri Warrick",
              "species": {
                "name": "Ewok"
              },
              "homeworld": {
                "name": "Endor"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Nien Nunb",
              "species": {
                "name": "Sullustan"
              },
              "homeworld": {
                "name": "Sullust"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  }
                ]
              }
            },
            {
              "name": "Bib Fortuna",
              "species": {
                "name": "Twi'lek"
              },
              "homeworld": {
                "name": "Ryloth"
              },
              "starshipConnection": {
                "starships": []
              }
            }
          ]
        }
      },
      {
        "title": "The Phantom Menace",
        "releaseDate": "1999-05-19",
        "director": "George Lucas",
        "producers": [
          "Rick McCallum"
        ],
        "openingCrawl": "Turmoil has engulfed the\r\nGalactic Republic. The taxation\r\nof trade routes to outlying star\r\nsystems is in dispute.\r\n\r\nHoping to resolve the matter\r\nwith a blockade of deadly\r\nbattleships, the greedy Trade\r\nFederation has stopped all\r\nshipping to the small planet\r\nof Naboo.\r\n\r\nWhile the Congress of the\r\nRepublic endlessly debates\r\nthis alarming chain of events,\r\nthe Supreme Chancellor has\r\nsecretly dispatched two Jedi\r\nKnights, the guardians of\r\npeace and justice in the\r\ngalaxy, to settle the conflict....",
        "characterConnection": {
          "characters": [
            {
              "name": "C-3PO",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R2-D2",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Obi-Wan Kenobi",
              "species": null,
              "homeworld": {
                "name": "Stewjon"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Belbullab-22 starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Anakin Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo fighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Jabba Desilijic Tiure",
              "species": {
                "name": "Hutt"
              },
              "homeworld": {
                "name": "Nal Hutta"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Yoda",
              "species": {
                "name": "Yoda's species"
              },
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Palpatine",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Qui-Gon Jinn",
              "species": null,
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Nute Gunray",
              "species": {
                "name": "Neimodian"
              },
              "homeworld": {
                "name": "Cato Neimoidia"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Finis Valorum",
              "species": null,
              "homeworld": {
                "name": "Coruscant"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Padmé Amidala",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo fighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "H-type Nubian yacht",
                    "crew": "4",
                    "passengers": "unknown"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  }
                ]
              }
            },
            {
              "name": "Jar Jar Binks",
              "species": {
                "name": "Gungan"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Roos Tarpals",
              "species": {
                "name": "Gungan"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Rugor Nass",
              "species": {
                "name": "Gungan"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Ric Olié",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo Royal Starship",
                    "crew": "8",
                    "passengers": "unknown"
                  }
                ]
              }
            },
            {
              "name": "Watto",
              "species": {
                "name": "Toydarian"
              },
              "homeworld": {
                "name": "Toydaria"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Sebulba",
              "species": {
                "name": "Dug"
              },
              "homeworld": {
                "name": "Malastare"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Quarsh Panaka",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Shmi Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Darth Maul",
              "species": {
                "name": "Zabrak"
              },
              "homeworld": {
                "name": "Dathomir"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Scimitar",
                    "crew": "1",
                    "passengers": "6"
                  }
                ]
              }
            },
            {
              "name": "Ayla Secura",
              "species": {
                "name": "Twi'lek"
              },
              "homeworld": {
                "name": "Ryloth"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Ratts Tyerel",
              "species": {
                "name": "Aleena"
              },
              "homeworld": {
                "name": "Aleen Minor"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Dud Bolt",
              "species": {
                "name": "Vulptereen"
              },
              "homeworld": {
                "name": "Vulpter"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Gasgano",
              "species": {
                "name": "Xexto"
              },
              "homeworld": {
                "name": "Troiken"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Ben Quadinaros",
              "species": {
                "name": "Toong"
              },
              "homeworld": {
                "name": "Tund"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Mace Windu",
              "species": null,
              "homeworld": {
                "name": "Haruun Kal"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Ki-Adi-Mundi",
              "species": {
                "name": "Cerean"
              },
              "homeworld": {
                "name": "Cerea"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Kit Fisto",
              "species": {
                "name": "Nautolan"
              },
              "homeworld": {
                "name": "Glee Anselm"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Eeth Koth",
              "species": {
                "name": "Zabrak"
              },
              "homeworld": {
                "name": "Iridonia"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Adi Gallia",
              "species": {
                "name": "Tholothian"
              },
              "homeworld": {
                "name": "Coruscant"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Saesee Tiin",
              "species": {
                "name": "Iktotchi"
              },
              "homeworld": {
                "name": "Iktotch"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Yarael Poof",
              "species": {
                "name": "Quermian"
              },
              "homeworld": {
                "name": "Quermia"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Plo Koon",
              "species": {
                "name": "Kel Dor"
              },
              "homeworld": {
                "name": "Dorin"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Mas Amedda",
              "species": {
                "name": "Chagrian"
              },
              "homeworld": {
                "name": "Champala"
              },
              "starshipConnection": {
                "starships": []
              }
            }
          ]
        }
      },
      {
        "title": "Attack of the Clones",
        "releaseDate": "2002-05-16",
        "director": "George Lucas",
        "producers": [
          "Rick McCallum"
        ],
        "openingCrawl": "There is unrest in the Galactic\r\nSenate. Several thousand solar\r\nsystems have declared their\r\nintentions to leave the Republic.\r\n\r\nThis separatist movement,\r\nunder the leadership of the\r\nmysterious Count Dooku, has\r\nmade it difficult for the limited\r\nnumber of Jedi Knights to maintain \r\npeace and order in the galaxy.\r\n\r\nSenator Amidala, the former\r\nQueen of Naboo, is returning\r\nto the Galactic Senate to vote\r\non the critical issue of creating\r\nan ARMY OF THE REPUBLIC\r\nto assist the overwhelmed\r\nJedi....",
        "characterConnection": {
          "characters": [
            {
              "name": "C-3PO",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R2-D2",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Owen Lars",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Beru Whitesun lars",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Obi-Wan Kenobi",
              "species": null,
              "homeworld": {
                "name": "Stewjon"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Belbullab-22 starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Anakin Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo fighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Yoda",
              "species": {
                "name": "Yoda's species"
              },
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Palpatine",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Boba Fett",
              "species": null,
              "homeworld": {
                "name": "Kamino"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Slave 1",
                    "crew": "1",
                    "passengers": "6"
                  }
                ]
              }
            },
            {
              "name": "Nute Gunray",
              "species": {
                "name": "Neimodian"
              },
              "homeworld": {
                "name": "Cato Neimoidia"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Padmé Amidala",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo fighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "H-type Nubian yacht",
                    "crew": "4",
                    "passengers": "unknown"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  }
                ]
              }
            },
            {
              "name": "Jar Jar Binks",
              "species": {
                "name": "Gungan"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Watto",
              "species": {
                "name": "Toydarian"
              },
              "homeworld": {
                "name": "Toydaria"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Shmi Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Ayla Secura",
              "species": {
                "name": "Twi'lek"
              },
              "homeworld": {
                "name": "Ryloth"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Mace Windu",
              "species": null,
              "homeworld": {
                "name": "Haruun Kal"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Ki-Adi-Mundi",
              "species": {
                "name": "Cerean"
              },
              "homeworld": {
                "name": "Cerea"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Kit Fisto",
              "species": {
                "name": "Nautolan"
              },
              "homeworld": {
                "name": "Glee Anselm"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Plo Koon",
              "species": {
                "name": "Kel Dor"
              },
              "homeworld": {
                "name": "Dorin"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Mas Amedda",
              "species": {
                "name": "Chagrian"
              },
              "homeworld": {
                "name": "Champala"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Gregar Typho",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo fighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Cordé",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Cliegg Lars",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Poggle the Lesser",
              "species": {
                "name": "Geonosian"
              },
              "homeworld": {
                "name": "Geonosis"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Luminara Unduli",
              "species": {
                "name": "Mirialan"
              },
              "homeworld": {
                "name": "Mirial"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Barriss Offee",
              "species": {
                "name": "Mirialan"
              },
              "homeworld": {
                "name": "Mirial"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Dormé",
              "species": {
                "name": "Human"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Dooku",
              "species": {
                "name": "Human"
              },
              "homeworld": {
                "name": "Serenno"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Bail Prestor Organa",
              "species": {
                "name": "Human"
              },
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Jango Fett",
              "species": null,
              "homeworld": {
                "name": "Concord Dawn"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Zam Wesell",
              "species": {
                "name": "Clawdite"
              },
              "homeworld": {
                "name": "Zolan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Dexter Jettster",
              "species": {
                "name": "Besalisk"
              },
              "homeworld": {
                "name": "Ojom"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Lama Su",
              "species": {
                "name": "Kaminoan"
              },
              "homeworld": {
                "name": "Kamino"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Taun We",
              "species": {
                "name": "Kaminoan"
              },
              "homeworld": {
                "name": "Kamino"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Jocasta Nu",
              "species": {
                "name": "Human"
              },
              "homeworld": {
                "name": "Coruscant"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R4-P17",
              "species": null,
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Wat Tambor",
              "species": {
                "name": "Skakoan"
              },
              "homeworld": {
                "name": "Skako"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "San Hill",
              "species": {
                "name": "Muun"
              },
              "homeworld": {
                "name": "Muunilinst"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Shaak Ti",
              "species": {
                "name": "Togruta"
              },
              "homeworld": {
                "name": "Shili"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Sly Moore",
              "species": null,
              "homeworld": {
                "name": "Umbara"
              },
              "starshipConnection": {
                "starships": []
              }
            }
          ]
        }
      },
      {
        "title": "Revenge of the Sith",
        "releaseDate": "2005-05-19",
        "director": "George Lucas",
        "producers": [
          "Rick McCallum"
        ],
        "openingCrawl": "War! The Republic is crumbling\r\nunder attacks by the ruthless\r\nSith Lord, Count Dooku.\r\nThere are heroes on both sides.\r\nEvil is everywhere.\r\n\r\nIn a stunning move, the\r\nfiendish droid leader, General\r\nGrievous, has swept into the\r\nRepublic capital and kidnapped\r\nChancellor Palpatine, leader of\r\nthe Galactic Senate.\r\n\r\nAs the Separatist Droid Army\r\nattempts to flee the besieged\r\ncapital with their valuable\r\nhostage, two Jedi Knights lead a\r\ndesperate mission to rescue the\r\ncaptive Chancellor....",
        "characterConnection": {
          "characters": [
            {
              "name": "Luke Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "X-wing",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "C-3PO",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R2-D2",
              "species": {
                "name": "Droid"
              },
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Darth Vader",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "TIE Advanced x1",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Leia Organa",
              "species": null,
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Owen Lars",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Beru Whitesun lars",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Obi-Wan Kenobi",
              "species": null,
              "homeworld": {
                "name": "Stewjon"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Belbullab-22 starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Anakin Skywalker",
              "species": null,
              "homeworld": {
                "name": "Tatooine"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo fighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "Trade Federation cruiser",
                    "crew": "600",
                    "passengers": "48247"
                  },
                  {
                    "name": "Jedi Interceptor",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Wilhuff Tarkin",
              "species": null,
              "homeworld": {
                "name": "Eriadu"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Chewbacca",
              "species": {
                "name": "Wookie"
              },
              "homeworld": {
                "name": "Kashyyyk"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Millennium Falcon",
                    "crew": "4",
                    "passengers": "6"
                  },
                  {
                    "name": "Imperial shuttle",
                    "crew": "6",
                    "passengers": "20"
                  }
                ]
              }
            },
            {
              "name": "Yoda",
              "species": {
                "name": "Yoda's species"
              },
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Palpatine",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Nute Gunray",
              "species": {
                "name": "Neimodian"
              },
              "homeworld": {
                "name": "Cato Neimoidia"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Padmé Amidala",
              "species": null,
              "homeworld": {
                "name": "Naboo"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Naboo fighter",
                    "crew": "1",
                    "passengers": "0"
                  },
                  {
                    "name": "H-type Nubian yacht",
                    "crew": "4",
                    "passengers": "unknown"
                  },
                  {
                    "name": "Naboo star skiff",
                    "crew": "3",
                    "passengers": "3"
                  }
                ]
              }
            },
            {
              "name": "Ayla Secura",
              "species": {
                "name": "Twi'lek"
              },
              "homeworld": {
                "name": "Ryloth"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Mace Windu",
              "species": null,
              "homeworld": {
                "name": "Haruun Kal"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Ki-Adi-Mundi",
              "species": {
                "name": "Cerean"
              },
              "homeworld": {
                "name": "Cerea"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Kit Fisto",
              "species": {
                "name": "Nautolan"
              },
              "homeworld": {
                "name": "Glee Anselm"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Eeth Koth",
              "species": {
                "name": "Zabrak"
              },
              "homeworld": {
                "name": "Iridonia"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Adi Gallia",
              "species": {
                "name": "Tholothian"
              },
              "homeworld": {
                "name": "Coruscant"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Saesee Tiin",
              "species": {
                "name": "Iktotchi"
              },
              "homeworld": {
                "name": "Iktotch"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Plo Koon",
              "species": {
                "name": "Kel Dor"
              },
              "homeworld": {
                "name": "Dorin"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Jedi starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Poggle the Lesser",
              "species": {
                "name": "Geonosian"
              },
              "homeworld": {
                "name": "Geonosis"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Luminara Unduli",
              "species": {
                "name": "Mirialan"
              },
              "homeworld": {
                "name": "Mirial"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Dooku",
              "species": {
                "name": "Human"
              },
              "homeworld": {
                "name": "Serenno"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Bail Prestor Organa",
              "species": {
                "name": "Human"
              },
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "R4-P17",
              "species": null,
              "homeworld": {
                "name": "unknown"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Shaak Ti",
              "species": {
                "name": "Togruta"
              },
              "homeworld": {
                "name": "Shili"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Grievous",
              "species": {
                "name": "Kaleesh"
              },
              "homeworld": {
                "name": "Kalee"
              },
              "starshipConnection": {
                "starships": [
                  {
                    "name": "Belbullab-22 starfighter",
                    "crew": "1",
                    "passengers": "0"
                  }
                ]
              }
            },
            {
              "name": "Tarfful",
              "species": {
                "name": "Wookie"
              },
              "homeworld": {
                "name": "Kashyyyk"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Raymus Antilles",
              "species": null,
              "homeworld": {
                "name": "Alderaan"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Sly Moore",
              "species": null,
              "homeworld": {
                "name": "Umbara"
              },
              "starshipConnection": {
                "starships": []
              }
            },
            {
              "name": "Tion Medon",
              "species": {
                "name": "Pau'an"
              },
              "homeworld": {
                "name": "Utapau"
              },
              "starshipConnection": {
                "starships": []
              }
            }
          ]
        }
      }
    ]
  }
};

async function readFile(fd) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader()
        reader.onerror = reject
        reader.onload = async e => {
            let buff = reader.result
            resolve(buff)
        }
        // read the file, and wait for 'onload' to be called
        reader.readAsArrayBuffer(fd)
    })
};

async function onFileChosen() {
    console.log("file chosen");
    let content = await readFile(this.files[0]);

    let doc = await createReport({
      template: content,
      data: data
    });
    console.log(doc)


    var downloadBlob, downloadURL;
    downloadBlob = function(data, fileName, mimeType) {
      var blob, url;
      blob = new Blob([data], {
        type: mimeType
      });
      url = window.URL.createObjectURL(blob);
      downloadURL(url, fileName, mimeType);
      setTimeout(function() {
        return window.URL.revokeObjectURL(url);
      }, 1000);
    };
    downloadURL = function(data, fileName) {
      var a;
      a = document.createElement('a');
      a.href = data;
      a.download = fileName;
      document.body.appendChild(a);
      a.style = 'display: none';
      a.click();
      a.remove();
    };
    downloadBlob(doc, 'report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

};

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");
    var inputElement = document.getElementById("input");
    inputElement.addEventListener("change", onFileChosen, false);
});


console.log("Swapi loaded ")
