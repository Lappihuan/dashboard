//
// SPDX-FileCopyrightText: 2023 SAP SE or an SAP affiliate company and Gardener contributors
//
// SPDX-License-Identifier: Apache-2.0
//

'use strict'

const { helm } = fixtures

const renderTemplates = helm.renderDashboardApplicationTemplates

describe('gardener-dashboard', function () {
  describe('serviceaccount', function () {
    let templates

    beforeEach(() => {
      templates = [
        'serviceaccount',
      ]
    })

    it('should render the template', async function () {
      const values = {}
      const documents = await renderTemplates(templates, values)
      expect(documents).toHaveLength(1)
      const [serviceaccount] = documents
      expect(serviceaccount).toMatchSnapshot()
    })

    it('should not render the template', async function () {
      const values = {
        global: {
          virtualGarden: {
            enabled: true,
            dashboardUserName: 'runtime-cluster:system:serviceaccount:garden:gardener-dashboard',
          },
        },
      }
      const documents = await renderTemplates(templates, values)
      expect(documents).toHaveLength(1)
      const [serviceaccount] = documents
      expect(serviceaccount).toBe(null)
    })
  })
})
