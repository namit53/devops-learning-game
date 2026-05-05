# Walkthrough: How to Clear Level 1 (DCIB Recruitment Terminal)

Welcome to the **DevOps Crime Investigation Bureau (DCIB)** Recruitment Screening! This walkthrough covers the step-by-step instructions to successfully solve all Level 1 objectives and earn your clearance.

## Overview of Level 1 Objectives
1. **Identity Confirmed**: Look around the directory to find and read your welcome note.
2. **Vault Discovered**: Find and navigate into the secret config vault.
3. **Encryption Bypassed**: Restore access to the locked credentials file by changing its permissions.
4. **Clearance Granted**: Decode the credentials, authenticate with the `login` command, and initiate the investigation to move on to Level 2.

---

## Step-by-Step Guide

### Step 1: Confirm Your Identity
When the terminal launches, you start as a recruit in the home directory.
1. Run the `ls` command to see the files present:
   ```bash
   ls -la
   ```
2. You will see a file named `welcome_note.txt`. Read its contents to identify your Candidate ID:
   ```bash
   cat welcome_note.txt
   ```
   > [!NOTE]
   > The output reveals your **Candidate ID**: `8472`.
   > This action triggers the **Identity Confirmed** objective.

---

### Step 2: Discover the Hidden Vault
The welcome note indicates that you should check hidden configuration directories.
1. Move into the hidden `.config/dcib_vault` directory:
   ```bash
   cd .config/dcib_vault
   ```
2. Check the contents of this folder:
   ```bash
   ls -la
   ```
   > [!NOTE]
   > You will see three files: `access.log`, `hint.txt`, and `credentials.b64`.
   > This action triggers the **Vault Discovered** objective.

---

### Step 3: Bypass Encryption
To see the credentials, you'll first need to read the instructions in the hint file.
1. Read `hint.txt`:
   ```bash
   cat hint.txt
   ```
   The hint notes that the password file (`credentials.b64`) is locked and suggests using `chmod` to unlock it.
2. Change the file permissions of `credentials.b64` so it's readable:
   ```bash
   chmod 600 credentials.b64
   ```
   > [!NOTE]
   > This restores access and triggers the **Encryption Bypassed** objective.

---

### Step 4: Submit Your Decoded Credentials
Now that the credentials file is readable, you must view and decode its content.
1. View the encoded credentials:
   ```bash
   cat credentials.b64
   ```
   You will see the Base64 string: `ZGVsdGFTZWN1cmU=`.
2. Decode the code using the terminal's built-in `base64` tool:
   ```bash
   echo "ZGVsdGFTZWN1cmU=" | base64 -d
   ```
   > [!TIP]
   > Decoded Password: `deltaSecure`

---

### Step 5: Authenticate and Claim Your Clearance
Now that you have both your Candidate ID and the password, you can login.
1. Run the `login` command:
   ```bash
   login
   ```
2. Provide the following details at the prompts:
   - **Agent ID:** `8472`
   - **Password:** `deltaSecure`
3. After authenticating, run `view-cases` to view current open investigations:
   ```bash
   view-cases
   ```
4. Finally, start the case using the `solve` command:
   ```bash
   solve case1
   ```
   > [!NOTE]
   > Running this command redirects you to Level 2 and completes the Level 1 screening!
