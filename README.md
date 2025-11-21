studio-9386978945:~/studio{main}$ git remote -v
origin  https://github.com/PateCodes/yungchaf-music.git (fetch)
origin  https://github.com/PateCodes/yungchaf-music.git (push)
studio-9386978945:~/studio{main}$ git add .
ase Studio"
studio-9386978945:~/studio{main}$ git commit -m "Initial commit from Firebase Studio"
On branch main
nothing to commit, working tree clean
studio-9386978945:~/studio{main}$ git push -u origin main
Enumerating objects: 3859, done.
Counting objects: 100% (3859/3859), done.
Delta compression using up to 2 threads
Compressing objects: 100% (3480/3480), done.
Writing objects: 100% (3859/3859), 714.61 KiB | 3.65 MiB/s, done.
Total 3859 (delta 2533), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (2533/2533), done.
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: 
remote: - GITHUB PUSH PROTECTION
remote:   —————————————————————————————————————————
remote:     Resolve the following violations before pushing again
remote: 
remote:     - Push cannot contain secrets
remote: 
remote:     
remote:      (?) Learn how to resolve a blocked push
remote:      https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line#resolving-a-blocked-push
remote:     
remote:     
remote:       —— Stripe Test API Secret Key ————————————————————————
remote:        locations:
remote:          - commit: ee233bb70b003e5d8d8a2affba37c6a45f4ee931
remote:            path: pages/api/payments/stripe-webhook.ts:9
remote:          - commit: 4e0b9f4e8c5aba992571511af5af3c09b5e45594
remote:            path: pages/api/payments/stripe-webhook.ts:10
remote:          - commit: 9b163f170e200d949c801c3771797a4c05dc613b
remote:            path: pages/api/payments/stripe.ts:6
remote:          - commit: ee233bb70b003e5d8d8a2affba37c6a45f4ee931
remote:            path: pages/api/payments/stripe.ts:8
remote:          - commit: 7e6eaf2b8c8511fbab95069a69d3f1bb1cac7d3b
remote:            path: pages/api/payments/stripe.ts:9
remote:     
remote:        (?) To push, remove secret from commit(s) or follow this URL to allow the secret.
remote:        https://github.com/PateCodes/yungchaf-music/security/secret-scanning/unblock-secret/35n8VZuyEmzn73RXP9WL9Wi2P0g
remote:     
remote: 
remote: 
To https://github.com/PateCodes/yungchaf-music.git
 ! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'https://github.com/PateCodes/yungchaf-music.git'
studio-9386978945:~/studio{main}$ studio-9386978945:~/studio{main}$ rm -rf .git
studio-9386978945:~/studio$ git init
Initialized empty Git repository in /home/user/studio/.git/
studio-9386978945:~/studio$ # Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
