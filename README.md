# B2B Project

This repository contains the B2B application code.

## Git LFS

This repository uses Git Large File Storage (LFS) for managing large files. The following file types are tracked with Git LFS:

- Large binary files (.zip, .rar, .7z, .tar.gz)
- Node binary files (.node)
- Large JavaScript build assets

## Setup

Before cloning or working with this repository, make sure you have Git LFS installed:

```
git lfs install
```

## Ignored Files

Some large files are ignored to keep the repository size manageable:
- MongoDB memory server cache files
- Node modules
- Build directories

Please refer to the `.gitignore` file for a complete list of ignored files. 