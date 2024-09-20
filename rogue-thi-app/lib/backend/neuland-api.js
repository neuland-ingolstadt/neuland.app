import { gql, request } from 'graphql-request'

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_NEULAND_GRAPHQL_ENDPOINT ||
  'https://api.neuland.app/graphql'
class NeulandAPIClient {
  async performGraphQLQuery(query) {
    try {
      const data = await request(GRAPHQL_ENDPOINT, query)
      return data
    } catch (e) {
      console.error(e)
      throw new Error('GraphQL query failed', e)
    }
  }

  async getAnnouncements() {
    return await this.performGraphQLQuery(
      gql`
        query {
          announcements {
            id
            title {
              de
              en
            }
            description {
              de
              en
            }
            startDateTime
            endDateTime
            priority
            url
          }
        }
      `.replace(/\s+/g, ' ')
    )
  }

  async getFoodPlan(locations) {
    return await this.performGraphQLQuery(
      gql`
			query {
			food(locations: [${locations.map((x) => `"${x}"`).join(',')}]) {
				errors {
					location
					message
				}
				foodData {
					timestamp
					meals {
						name {
							de
							en
						}
						id
						category
						prices {
							student
							employee
							guest
						}
						allergens
						flags
						nutrition {
							kj
							kcal
							fat
							fatSaturated
							carbs
							sugar
							fiber
							protein
							salt
						}
						variants {
							additional
							id
							allergens
							flags
							originalLanguage
							static
							restaurant
							parent {
								id
								category
								name {
									de
									en
								}
							}
							name {
								de
								en
							}
							prices {
								student
								employee
								guest
							}
							nutrition {
								kj
								kcal
								fat
								fatSaturated
								carbs
								sugar
								fiber
								protein
								salt
							}
						}
						originalLanguage
						static
						restaurant
					}
				}
			}
		}`.replace(/\s+/g, ' ')
    )
  }

  /**
   * @param {string} station Bus station identifier
   */
  async getBusPlan(station) {
    return this.performGraphQLQuery(
      gql`
      query {
        bus(station: "${station}") {
          route
          destination
          time
        }
      }
    `.replace(/\s+/g, ' ')
    )
  }

  /**
   * @param {string} station Train station identifier
   */
  async getTrainPlan(station) {
    return this.performGraphQLQuery(
      gql`
      query {
        train(station: "${station}") {
					name
					destination
					plannedTime
					actualTime
					canceled
					track
        }
      }
    `.replace(/\s+/g, ' ')
    )
  }

  async getParkingData() {
    return this.performGraphQLQuery(
      gql`
        query {
          parking {
            lots {
              name
              available
              total
              priceLevel
            }
          }
        }
      `.replace(/\s+/g, ' ')
    )
  }

  async getCharingStationData() {
    return this.performGraphQLQuery(
      gql`
        query {
          charging {
            id
            name
            available
            total
          }
        }
      `.replace(/\s+/g, ' ')
    )
  }

  async getCampusLifeEvents() {
    return await this.performGraphQLQuery(
      gql`
        query {
          clEvents {
            id
            organizer
            title
            begin
            end
          }
        }
      `.replace(/\s+/g, ' ')
    )
  }
}

export default new NeulandAPIClient()
