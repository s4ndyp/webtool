/// <reference path="../pb_data/types.d.ts" />

migrate(
  (db) => {
    const dao = new Dao(db);

    const subsites = new Collection({
      type: "base",
      name: "subsites",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      schema: [
        {
          name: "name",
          type: "text",
          required: true,
          options: { min: 1, max: 200 },
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          options: {
            min: 1,
            max: 100,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          },
        },
        {
          name: "icon",
          type: "file",
          required: false,
          options: {
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
              "image/svg+xml",
            ],
          },
        },
      ],
    });

    dao.saveCollection(subsites);

    const subsitesCollection = dao.findCollectionByNameOrId("subsites");

    const siteFiles = new Collection({
      type: "base",
      name: "site_files",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      schema: [
        {
          name: "subsite",
          type: "relation",
          required: true,
          options: {
            collectionId: subsitesCollection.id,
            cascadeDelete: true,
            maxSelect: 1,
            minSelect: 1,
          },
        },
        {
          name: "path",
          type: "text",
          required: true,
          options: { min: 1, max: 500 },
        },
        {
          name: "file",
          type: "file",
          required: true,
          options: {
            maxSelect: 1,
            maxSize: 52428800,
          },
        },
      ],
    });

    dao.saveCollection(siteFiles);
  },
  (db) => {
    const dao = new Dao(db);
    try {
      dao.deleteCollection(dao.findCollectionByNameOrId("site_files"));
    } catch {
      /* already removed */
    }
    try {
      dao.deleteCollection(dao.findCollectionByNameOrId("subsites"));
    } catch {
      /* already removed */
    }
  }
);
