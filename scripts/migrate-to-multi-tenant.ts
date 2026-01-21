/**
 * Migration script for converting single-tenant uptime monitor to multi-tenant
 *
 * This script:
 * 1. Creates a default organization
 * 2. Creates the first user as owner
 * 3. Adds organizationId to all existing monitors, status pages, contact lists
 * 4. Adds userId and organizationId to all existing device tokens
 * 5. Creates necessary indexes
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-multi-tenant.ts
 *
 * Environment variables required:
 *   MONGODB_URI - MongoDB connection string
 *   ADMIN_EMAIL - Email for the first owner user
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  if (!ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL environment variable is required for migration')
  }

  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Failed to get database connection')
  }

  try {
    // Step 1: Check if migration already done
    const existingOrg = await db.collection('organizations').findOne({ slug: 'default' })
    if (existingOrg) {
      console.log('Migration already completed. Default organization exists.')
      console.log('If you want to re-run, delete the default organization first.')
      return
    }

    // Step 2: Create default organization
    console.log('\n1. Creating default organization...')
    const orgResult = await db.collection('organizations').insertOne({
      name: 'Default Organization',
      slug: 'default',
      plan: 'free',
      settings: {
        maxMonitors: 100, // Generous limit for migrated data
        maxContactLists: 20,
        maxMembers: 50,
        checkInterval: 30,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const defaultOrgId = orgResult.insertedId
    console.log(`   Created organization: ${defaultOrgId}`)

    // Step 3: Create first user as owner
    console.log(`\n2. Creating owner user: ${ADMIN_EMAIL}`)
    const userResult = await db.collection('users').insertOne({
      email: ADMIN_EMAIL.toLowerCase(),
      name: 'Admin',
      emailVerified: true,
      organizationId: defaultOrgId,
      role: 'owner',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const ownerId = userResult.insertedId
    console.log(`   Created user: ${ownerId}`)

    // Step 4: Update all monitors with organizationId
    console.log('\n3. Migrating monitors...')
    const monitorResult = await db.collection('monitors').updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: defaultOrgId } }
    )
    console.log(`   Updated ${monitorResult.modifiedCount} monitors`)

    // Step 5: Update all status pages with organizationId
    console.log('\n4. Migrating status pages...')
    const statusPageResult = await db.collection('statuspages').updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: defaultOrgId } }
    )
    console.log(`   Updated ${statusPageResult.modifiedCount} status pages`)

    // Step 6: Update all contact lists with organizationId
    console.log('\n5. Migrating contact lists...')
    const contactListResult = await db.collection('contactlists').updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: defaultOrgId } }
    )
    console.log(`   Updated ${contactListResult.modifiedCount} contact lists`)

    // Step 7: Update all device tokens with userId and organizationId
    console.log('\n6. Migrating device tokens...')
    const deviceResult = await db.collection('devicetokens').updateMany(
      { organizationId: { $exists: false } },
      {
        $set: {
          organizationId: defaultOrgId,
          userId: ownerId,
        },
      }
    )
    console.log(`   Updated ${deviceResult.modifiedCount} device tokens`)

    // Step 8: Create indexes
    console.log('\n7. Creating indexes...')

    // Organization indexes
    await db.collection('organizations').createIndex({ slug: 1 }, { unique: true })
    console.log('   Created organizations.slug index')

    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('users').createIndex({ organizationId: 1 })
    console.log('   Created users indexes')

    // Monitor indexes
    await db.collection('monitors').createIndex({ organizationId: 1 })
    await db.collection('monitors').createIndex({ organizationId: 1, createdAt: -1 })
    console.log('   Created monitors indexes')

    // Status page indexes
    await db.collection('statuspages').createIndex({ organizationId: 1 })
    await db.collection('statuspages').createIndex({ organizationId: 1, slug: 1 }, { unique: true })
    console.log('   Created statuspages indexes')

    // Contact list indexes
    await db.collection('contactlists').createIndex({ organizationId: 1 })
    console.log('   Created contactlists indexes')

    // Device token indexes
    await db.collection('devicetokens').createIndex({ organizationId: 1 })
    await db.collection('devicetokens').createIndex({ userId: 1 })
    console.log('   Created devicetokens indexes')

    // OTP token indexes
    await db.collection('otptokens').createIndex({ email: 1, createdAt: -1 })
    await db.collection('otptokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    console.log('   Created otptokens indexes')

    // Invitation indexes
    await db.collection('invitations').createIndex({ token: 1 }, { unique: true })
    await db.collection('invitations').createIndex({ email: 1, organizationId: 1 })
    await db.collection('invitations').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    console.log('   Created invitations indexes')

    console.log('\n========================================')
    console.log('Migration completed successfully!')
    console.log('========================================')
    console.log(`\nOrganization ID: ${defaultOrgId}`)
    console.log(`Owner User ID: ${ownerId}`)
    console.log(`Owner Email: ${ADMIN_EMAIL}`)
    console.log('\nNext steps:')
    console.log('1. Login with your email to receive an OTP')
    console.log('2. You can now invite other users to your organization')
    console.log('3. Remove ADMIN_USERNAME and ADMIN_PASSWORD from .env (no longer needed)')
  } catch (error) {
    console.error('\nMigration failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error)
  process.exit(1)
})
