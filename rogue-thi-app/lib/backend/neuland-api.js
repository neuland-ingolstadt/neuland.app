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
		  food(locations: [${locations.join(',')}]) {
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

  async getCampusLifeEvents() {
    return await this.performGraphQLQuery(
      gql`
        query {
          clEvents {
            id
            organizer
            title
            location
            begin
            end
          }
        }
      `.replace(/\s+/g, ' ')
    )
  }

  async getUniversitySports() {
    return await this.performGraphQLQuery(
      gql`
        query {
          universitySports {
            id
            title {
              de
              en
            }
            description {
              de
              en
            }
            campus
            location
            weekday
            startTime
            endTime
            requiresRegistration
            invitationLink
            eMail
            createdAt
            updatedAt
          }
        }
      `.replace(/\s+/g, ' ')
    )
  }
}

export default new NeulandAPIClient()
