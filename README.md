# DeviceInsights
Just device insights tool based on any phone serial number anywhere in the world.
Feel free to test, clone and use it for your telecom projects.
This is a bit of side project for me, looking forward to improve this over time with your help.

How does this work (simplified explanation):

Part of IMEI is called TAC and represents unique make and model. GSMA (which assigns IMEI numbers) has given out about 300K of such TACs.
TACs go into Gemini 1.5 Flash vis API. Queries and associated data for each API key get stored. Results displayed for end-user.
Other data gets stored in PostgresQL DB. Using scalable NeonDB for this. Admin access available for users of each key via API.
Logs and other tools available on infra side: reports and graphs on countries, IP addresses, etc.

Coverage analysis for now is based on 10km radius and Downdetector data analysis per fixed and wireless complaints.

Future functionality on monthly insight to users.
